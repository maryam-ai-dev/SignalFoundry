# Architecture

Spring Boot is the authority layer — it owns all product state, business entities, job records, and write authority over durable data. FastAPI with Celery is the intelligence layer — it owns all connectors, normalization, embeddings, analysis engines, generation engines, voice stylometry, and semantic retrieval. Spring persists what FastAPI computes. The two services communicate over internal HTTP endpoints: Spring enqueues jobs via FastAPI, and Celery workers call Spring back on completion to persist results and advance run state.
