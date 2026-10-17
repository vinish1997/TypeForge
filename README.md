# TypeForge ⚡

[![TypeForge CI/CD](https://github.com/vinish1997/TypeForge/actions/workflows/ci.yml/badge.svg)](https://github.com/vinish1997/TypeForge/actions/workflows/ci.yml)    [![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-blue?style=flat&logo=github)](https://vinish1997.github.io/TypeForge/)

> **High-Performance Typing Practice Engine for Competitive Programmers & Software Engineers**  
> **Live Demo**: [https://vinish1997.github.io/TypeForge/](https://vinish1997.github.io/TypeForge/)

TypeForge is an ultra-fast, zero-jank typing application specialized for mastering code syntax, language symbols, and algorithmic patterns in Python and Java.

---

## ✨ Features
* **Real Algorithmic Corpus**: Authentic code snippets modeled after competitive programming algorithms (Binary Search, Two Pointers, Fast I/O).
* **IDE-Fidelity Ergonomics**: Line numbers, newline glyphs, auto-indentation skipping, and atomic indentation backspace rollback matching VS Code / IntelliJ.
* **Ultra-Low Latency Engine**: Direct-DOM token caching achieving **0.0005 ms** execution latency per keystroke (~27,000x faster than the 16.6ms 60fps frame budget).
* **Enterprise Telemetry**: Standard Gross & Net WPM, real-time accuracy scoring, and a 3-second warm-up jitter suppression window.
* **Zero Network Jitter**: 100% in-memory client-side execution.
* **Ultra-Lightweight Footprint**: Under **7 kB** gzipped production bundle, compiling in ~50ms.

---

## 🏗️ Architecture & Tech Stack
* **Language & Runtime**: TypeScript + Vite (Vanilla Direct-DOM)
* **Design Pattern**: Decoupled Pub/Sub EventBus isolating the Core Typing Engine from Telemetry and UI Rendering
* **Testing**: Vitest (Unit tests, End-to-End Integration tests, and NFR-01 latency benchmarks)
* **CI/CD**: GitHub Actions automated pipeline (Lint, Typecheck, Test, Build, and GitHub Pages deployment)

---

## 🚀 Quickstart

### Prerequisites
* Node.js (v20+ recommended)
* npm

### Installation
```bash
npm ci
```

### Development Server
```bash
npm run dev
```

### Run Test Suite & Latency Benchmarks
```bash
npm test -- --run
```

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 📜 License
MIT
