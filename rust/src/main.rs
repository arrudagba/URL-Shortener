use actix_web::{get, post, web, HttpResponse, Responder, App, HttpServer};
use actix_cors::Cors;
use sqlx::PgPool;
use std::env;
use dotenv::dotenv;
use rand::{distr::Alphanumeric, Rng};
use serde_json;
use url::Url; 

#[get("/{path}")]
async fn redirect(path: web::Path<String>, pool: web::Data<PgPool>) -> impl Responder {
    match get_original_url(&pool, &path).await {
        Some(original_url) => HttpResponse::Found()
            .append_header(("Location", original_url))
            .finish(),
        None => HttpResponse::NotFound().body("URL not found"),
    }
}

#[post("/shorten")]
async fn shorten_url(info: web::Json<ShortenRequest>, pool: web::Data<PgPool>) -> impl Responder {
    if let Err(_) = Url::parse(&info.url) {
        return HttpResponse::BadRequest().json(serde_json::json!({ "error": "Invalid URL" }));
    }

    let short_id = generate_short_id();
    if insert_url(&pool, &short_id, &info.url).await {
        HttpResponse::Ok().json(serde_json::json!({ "shortUrl": format!("http://127.0.0.1:8080/{}", short_id) }))
    } else {
        HttpResponse::InternalServerError().json(serde_json::json!({ "error": "Failed to shorten URL" }))
    }
}

async fn get_original_url(pool: &PgPool, short_id: &str) -> Option<String> {
    let row: Option<(String,)> = sqlx::query_as("SELECT url FROM shortener WHERE id = $1")
        .bind(short_id)
        .fetch_optional(pool)
        .await
        .ok()?;

    row.map(|r| r.0)
}

async fn insert_url(pool: &PgPool, short_id: &str, url: &str) -> bool {
    let result = sqlx::query("INSERT INTO shortener (id, url) VALUES ($1, $2)")
        .bind(short_id)
        .bind(url)
        .execute(pool)
        .await;

    match result {
        Ok(_) => true,
        Err(_) => false,
    }
}

fn generate_short_id() -> String {
    rand::rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect()
}

#[derive(serde::Deserialize)]
struct ShortenRequest {
    url: String,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let pool = PgPool::connect(&database_url).await.expect("Failed to connect to database");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec!["Content-Type"])
            .max_age(3600);

        App::new()
            .wrap(cors)
            .app_data(web::Data::new(pool.clone()))
            .service(redirect)
            .service(shorten_url)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}