# 🛍️ Marketplace — Full-Stack E-Commerce Platform

Modern e-commerce platform connecting **customers** and **merchants**. Includes product/catalog management, cart, wishlist, orders, role-based security, **local file uploads**, notifications, and Kubernetes-ready deployment.

---

## 🧱 Stack
- **Backend:** Java 17, Spring Boot, Spring Security (JWT), Spring Data JPA, Liquibase, PostgreSQL, WebSockets (STOMP)
- **Frontend:** React + Vite + Tailwind CSS
- **DevOps:** Docker, Kubernetes (Manifests in `backend/k8s`), Docker Compose (optional)

---

## 🗂 Structure
```
marketplace/
├── backend/        # Spring Boot service
│   ├── src/
│   ├── Dockerfile
│   └── k8s/        # Kubernetes YAML manifests (Deployments, Services, PVCs)
└── frontend/       # React + Vite UI
    ├── src/
    └── Dockerfile
```

---

## 🐳 Build Container Images (Required for K8s)
Before deploying to Kubernetes, build the images locally so `imagePullPolicy: Never` can find them. Run these from the project root:

```bash
# 1. Build Backend
docker build -t backend-marketplace-app:latest ./backend

# 2. Build Frontend
docker build -t frontend-marketplace-app:latest ./frontend
```

---

## ☸️ Run on Kubernetes (Production Mode)

This is the primary deployment method using **Docker Desktop Kubernetes**.

### 🚀 Deploy (One-Shot)
Run this command from the root folder to apply all configurations, database, backend, and frontend:

```bash
kubectl apply -f backend/k8s/
```

### ⏳ Startup Status
Wait 1-2 minutes for Postgres to initialize and Backend to start. Check status:
```bash
kubectl get pods
# All pods should eventually show status: Running and READY: 1/1
```
*Note: The backend pod uses an `initContainer` to wait until Postgres (port 5433) is fully ready.*

### 🌐 Access Points
| Service | URL / Connection | Notes |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Main User Interface |
| **Backend API** | [http://localhost:8080](http://localhost:8080) | Swagger/API Root |
| **Database** | `localhost:5433` | User: `postgres`, Pass: `password`, DB: `app_db` |

*Note: Images uploaded via the app are persistent (saved in a PVC) and served at `http://localhost:8080/uploads/...`.*

---

## 🧹 Reset / Clean Slate (For Presentation)
To completely wipe the database and restart everything from scratch:

```bash
# 1. Delete all K8s resources
kubectl delete -f backend/k8s/

# 2. Delete persistent volumes (Wipes DB & Uploaded Images)
kubectl delete pvc postgres-data-v2 backend-uploads-pvc

# 3. Re-deploy
kubectl apply -f backend/k8s/
```

---

## 🛠 Configuration Details

### Manifests Overview (`backend/k8s/`)
- **`configmap.yaml`**: DB Host (`marketplace-postgres`), Port (`5433`).
- **`secret.yaml`**: DB Password (`password`), JWT Secret.
- **`postgres.yaml`**: Stateful DB. Exposed via **LoadBalancer** on port **5433** (mapped internally to 5432). Uses PVC `postgres-data-v2`.
- **`backend.yaml`**: Spring Boot App. Exposed via **LoadBalancer** on **8080**. Mounts PVC `backend-uploads-pvc` to `/app/uploads`.
- **`frontend.yaml`**: React App. Exposed via **LoadBalancer** on **3000** (mapped to container 5173).

### Local Development (Docker Compose)
*Alternative method if not using Kubernetes:*
```bash
cd backend
docker-compose up -d
# Backend: 8080, Postgres: 5433
# Frontend: cd frontend && npm run dev (Runs on 5173)
```

---

## 🧪 Common Troubleshooting
- **Backend CrashLoopBackOff:** Usually means Postgres isn't ready yet. The `initContainer` handles this, but if it persists, try `kubectl delete pod -l app=marketplace-backend` to restart the retry loop.
- **Images Not Showing:** Ensure the Backend Pod is `Running`. Images are served statically from the PVC.
- **Database Connection Refused:** Ensure you are connecting to port **5433** (not 5432) on localhost.

---
© 2025 — Marketplace Project
```