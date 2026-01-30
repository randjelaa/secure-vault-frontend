# Secure Vault Angular Application

This is a **Secure Vault** web application built with **Angular 17** standalone components. It provides a secure way to store, share, and manage secrets using **client-side encryption** with AES-GCM and RSA-OAEP. It supports multiple roles: **Admin**, **Team Lead**, and **Developer**.

The app is designed with strong security principles, including:

* End-to-end encrypted secrets
* Master password-based key derivation (PBKDF2)
* Per-user asymmetric key pairs for sharing secrets
* Role-based access control
* Automatic access token refresh and logout handling

---

## Table of Contents

* [Features](#features)
* [Roles](#roles)
* [Technology Stack](#technology-stack)
* [Setup & Run](#setup--run)
* [Environment Configuration](#environment-configuration)
* [Security](#security)
* [Folder Structure](#folder-structure)

---

## Features

* **Vault Initialization**: Users can create a vault protected by a master password.
* **Secrets Management**:

  * Create, update, delete secrets
  * Encrypt secrets with AES-GCM
  * Decrypt secrets locally using a master password
* **Secret Sharing**:

  * Teamleads can share secrets securely with other developers
  * Symmetric key encryption (AES-GCM) and asymmetric key wrapping (RSA-OAEP)
* **Role-based UI**:

  * Admin dashboard
  * Team Lead vault management
  * Developer view with shared secrets
* **Authentication**:

  * JWT access tokens
  * Automatic refresh token handling
  * Google OAuth support
* **Security Interceptors**:

  * HTTP error interceptor with redirect on server errors
  * Authorization interceptor for JWT token injection

---

## Roles

### Admin

* Initializes their vault locally if not already set up
* Can create secrets in their vault
* Can decrypt, update, and delete secrets
* Can see all system users (active and pending activation, as well as blocked ones)
* Accesses the admin dashboard for managing security policy
* Requires authentication

### Team Lead

* Initializes their vault locally if not already set up
* Can create secrets in their vault
* Can share secrets with developers
* Can decrypt, update, and delete secrets
* Manages the vault using a master password

### Developer

* Initializes their vault locally if not already set up
* Can create secrets in their vault
* Can decrypt, update, and delete secrets
* Can decrypt secrets shared with them
* Stores asymmetric keys locally for secure decryption
* Cannot modify shared secrets

---

## Technology Stack

* **Angular 17** (standalone components, FormsModule, RouterModule)
* **TypeScript**
* **RxJS** for async operations and HTTP streams
* **Web Crypto API** for cryptography
* **AES-GCM** for symmetric encryption of secrets
* **RSA-OAEP** for secure key sharing
* **JWT** for authentication
* **REST API backend** for persistence and user management

---

## Setup & Run

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Serve the app**:

   ```bash
   ng serve
   ```

   By default, it runs on `http://localhost:4200`.

3. **API Backend**:

   * Ensure your backend is running at the URL defined in the environment file (`http://localhost:8080` by default).
   * The backend handles authentication, vault storage, and secret sharing endpoints.

4. **Login**:

   * Use provided credentials for Admin, Team Lead, or Developer.
   * Users can optionally login with Google OAuth.

---

## Environment Configuration

Example `environment.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',

  vault: {
    key: 'vault_encrypted_key',
    salt: 'vault_salt',
    iv: 'vault_iv',
    private_key: 'vault_asym_private',
    public_key: 'vault_asym_public'
  },

  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID'
  },
};
```

* **Vault keys**: Used for storing encrypted keys and asymmetric key pairs in local storage
* **Google OAuth**: Optional login provider for Developers

---

## Security

* **Master Password & KEK**:

  * Derived using PBKDF2 with 300,000 iterations
  * Protects the Data Encryption Key (DEK) for AES-GCM

* **Secrets Encryption**:

  * AES-GCM 256-bit for symmetric encryption
  * AES-GCM IV is randomly generated per secret

* **Sharing Secrets**:

  * Each recipient receives the secret encrypted with a unique AES-GCM key
  * AES key is encrypted with recipient's public RSA key (RSA-OAEP)

* **Local Storage**:

  * Only encrypted keys are stored
  * Private keys encrypted with master password KEK
  * Public keys stored in cleartext for sharing

* **Token-based Authentication**:

  * Access tokens stored in `localStorage`
  * Refresh tokens used via HTTP-only cookies
  * Automatic token refresh and logout

---

## Notes

* The application uses **standalone Angular components**, so there’s no need for `NgModule` declarations.
* Cryptography is **client-side**, so never send plaintext secrets to the backend.
* Vault initialization must be done per user; the master password is **never transmitted**.
* Shared secrets can only be decrypted by intended recipients using their private keys.
* The visual appearance of the application was not a priority; the focus was entirely on implementing full functionality and ensuring secure, end-to-end encrypted vault operations.
