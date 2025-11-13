## Product Image Ingestion Microservice (Fastify + TypeScript)

This microservice automates the entire product image pipeline for my Laravel-based
e-commerce system. It processes a batch of 400+ products, retrieves realistic
category-specific images from Unsplash, uploads them to Cloudinary, and registers
the resulting URLs in the backend via authenticated internal API endpoints.

### Key Features
- 🚀 Fastify + TypeScript microservice architecture
- 🖼 Automated image retrieval using Unsplash API
- ☁ Cloudinary upload pipeline (4 images per product → 1600+ assets)
- 🔁 Retry & exponential backoff for unreliable network operations
- ⚙ Batch processing with concurrency control
- 📡 Integration with Laravel API (secure internal routes)
- 📊 Structured logging via Pino
- 🧩 Modular services: UnsplashService, CloudinaryService, ApiClient, Worker
- 🏗 Production-ready folder structure

### Why this project?
My Laravel e-commerce project required a realistic product catalog with
hundreds of items and multiple images per product. Manually uploading and
assigning thousands of images (400 products × 4 images = 1600 assets) was
not feasible and would slow down development significantly.

Instead of relying on manual admin uploads, I designed this microservice to
fully automate the entire workflow:
•	generate or fetch category-relevant product images
•	upload them to Cloudinary
•	register them directly in the Laravel backend

This approach allowed me to build a scalable, production-like asset pipeline
similar to what real e-commerce companies use. Rather than hardcoding mock
data or performing repetitive manual work, I treated the problem as an
opportunity to build a dedicated automated service — something modern teams
do through background workers, ingestion pipelines, and microservice
architectures.

In short, this project wasn’t created as a demo or generic template:
it was born from an actual need in my own e-commerce system and evolved
into a fully-fledged microservice that solves a real engineering problem.