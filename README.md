# 🛍️ Marketplace — Full-Stack E-Commerce Platform

Simple full‑stack marketplace app for **customers** and **merchants**.

- Backend: Java + Spring Boot + PostgreSQL
- Frontend: React + Vite + Tailwind CSS
- DevOps: Docker, Docker Compose, Kubernetes

This README explains **how to start** and **how to stop** the project in different ways.

---

## 🔧 Requirements

You do **not** need everything at once. It depends on how you want to run the app.

- For classic local run:
  - Java 17+
  - Node.js 18+
  - PostgreSQL (optional if you use Docker)
- For Docker:
  - Docker Desktop (with Docker Compose)
- For Kubernetes:
  - Docker Desktop with Kubernetes enabled, or Minikube
  - `kubectl` CLI

---

## 📁 Project Structure

```text
marketplace/
├── backend/      # Spring Boot API + DB migrations
│   ├── src/
│   ├── Dockerfile
│   └── k8s/      # Kubernetes YAML files
└── frontend/     # React + Vite UI
    ├── src/
    └── Dockerfile
```

---

## 1️⃣ Run Locally Without Docker (Classic Dev Mode)

This is the simplest way if you already have Java, Node, and PostgreSQL installed.

### 1.1. Start the Backend

Open a terminal:

```bash
cd backend
./gradlew bootRun          # on Windows: gradlew.bat bootRun
```

The backend will start on:

- **http://localhost:8080**

To **stop** the backend:

- Go to the terminal where `bootRun` is running and press **CTRL + C**.

> Note: PostgreSQL must be running and must match the settings in `backend/src/main/resources/application.yaml`.

### 1.2. Start the Frontend

Open a **second** terminal:

```bash
cd frontend
npm install          # only needed the first time
npm run dev
```

The frontend dev server will start on:

- **http://localhost:5173**

To **stop** the frontend dev server:

- Go to the terminal where `npm run dev` is running and press **CTRL + C**.

---

## 2️⃣ Run with Docker Compose (Recommended for Local Development)

In this mode:

- PostgreSQL and the backend run in Docker containers.
- The frontend still runs with `npm run dev`.

### 2.1. Start Backend + Database with Docker Compose

From the `backend` folder:

```bash
cd backend

# First time or after code changes:
docker compose up --build -d

# Next times (no code changes):
# docker compose up -d
```

This will start:

- `marketplace-postgres` (PostgreSQL)
- `marketplace-app` (Spring Boot backend)

Ports:

- Backend: **http://localhost:8080**
- PostgreSQL: **localhost:5433**

Check status:

```bash
docker compose ps
docker compose logs -f   # press CTRL + C to stop viewing logs
```

### 2.2. Start the Frontend

In another terminal:

```bash
cd frontend
npm install          # only needed the first time
npm run dev          # http://localhost:5173
```

To **stop** the frontend: press **CTRL + C** in that terminal.

### 2.3. Stop Docker Containers

From the `backend` folder:

```bash
cd backend
```

**Stop containers (keep database data):**

```bash
docker compose down
```

**Stop containers and delete volumes (reset DB & data):**

```bash
docker compose down -v
```

---

## 3️⃣ Run Everything as Docker Containers (Optional)

You can also run both backend and frontend as Docker containers.

### 3.1. Build Images

From the **project root**:

```bash
# Backend image
docker build -t backend-marketplace-app:latest ./backend

# Frontend image
docker build -t frontend-marketplace-app:latest ./frontend
```

### 3.2. Run Containers

Example:

```bash
# Backend container
docker run -p 8080:8080 backend-marketplace-app

# Frontend container
docker run -p 3000:5173 frontend-marketplace-app
```

Access:

- Backend: **http://localhost:8080**
- Frontend: **http://localhost:3000**

To **stop** these containers:

1. Check running containers:

   ```bash
   docker ps
   ```

2. Stop them:

   ```bash
   docker stop <container_id>
   ```

---

## 4️⃣ Run on Kubernetes

This is a more “production-like” deployment using Kubernetes.

### 4.1. Build Images for Kubernetes

Kubernetes manifests use `imagePullPolicy: Never`, so images must exist locally.

From the **project root**:

```bash
docker build -t backend-marketplace-app:latest ./backend
docker build -t frontend-marketplace-app:latest ./frontend
```

Make sure Kubernetes is running:

- Docker Desktop: enable Kubernetes  
  **or**
- Minikube: `minikube start`

### 4.2. Deploy to Kubernetes

From the **project root**:

```bash
kubectl apply -f backend/k8s/
```

This will create:

- PostgreSQL (deployment + service)
- Backend (deployment + service + PVC for uploads)
- Frontend (deployment + service)
- ConfigMap + Secret (DB + JWT config)

Check status:

```bash
kubectl get pods
kubectl get svc
```

All pods should eventually be in status **Running**.

### 4.3. Access the App on Kubernetes

Depending on your setup (Docker Desktop vs Minikube), the services expose:

- Frontend: **http://localhost:3000** (LoadBalancer service)
- Backend: **http://localhost:8080**
- PostgreSQL: **localhost:5433** (for local DB tools like DBeaver/pgAdmin)

With Minikube, you may also use:

```bash
minikube service marketplace-frontend
```

to open the frontend in a browser.

---

## 5️⃣ Stop and Clean Up Kubernetes Resources

### 5.1. Stop the App (Keep Data)

To stop all Kubernetes resources created by this project, but keep persistent volumes:

```bash
kubectl delete -f backend/k8s/
```

This deletes deployments, services, configmaps, and secrets, but **PVCs remain** (database and uploads).

### 5.2. Full Reset (Delete DB and Uploaded Files)

If you want a full clean slate:

```bash
# 1. Delete all K8s resources
kubectl delete -f backend/k8s/

# 2. Delete persistent volumes (names may vary, adjust if needed)
kubectl delete pvc postgres-data-v2 backend-uploads-pvc

# 3. Re-deploy from scratch
kubectl apply -f backend/k8s/
```

---

## ✅ Summary

- **Fast local test (no Docker):**  
  `./gradlew bootRun` + `npm run dev`

- **Recommended local dev:**  
  `docker compose up --build -d` for backend + DB, and `npm run dev` for frontend.

- **Production-like demo:**  
  `docker build ...` then `kubectl apply -f backend/k8s/`.

This covers all main ways to **start** and **stop** the project.
