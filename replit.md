# Buy-Sell Platform

## Overview
A modern e-commerce platform for buying and selling products online. Built with Next.js frontend and Node.js/Express backend.

## Project Structure
- **Frontend**: Next.js 14 with React 18, Tailwind CSS
  - Port: 5000 (development server)
  - Located in: `/buy-sell-platform/frontend`
  
- **Backend**: Node.js with Express
  - Port: 3000 (API server)
  - Located in: `/buy-sell-platform/backend`

## Technology Stack
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express, CORS
- **Package Manager**: npm

## Recent Changes
- 2025-10-29: Initial project setup
  - Created Next.js frontend with basic pages (home, products, login, register, seller dashboard)
  - Set up Express backend with API endpoints
  - Configured Tailwind CSS for styling
  - Added basic routing and navigation

## Architecture
- Frontend runs on port 5000 (user-facing)
- Backend runs on port 3000 (API server on localhost)
- Frontend configured to accept all hosts for Replit proxy compatibility

## Setup Instructions
1. Install frontend dependencies: `cd frontend && npm install`
2. Install backend dependencies: `cd backend && npm install`
3. Run frontend: `npm run dev` in frontend directory
4. Run backend: `npm run dev` in backend directory
