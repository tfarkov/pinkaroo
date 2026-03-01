# How to set up a proper MySQL instance on Kamatera

This guide covers creating and securing a MySQL server on [Kamatera](https://www.kamatera.com/) for use with the Pinkaroo portal (or any MySQL app). It includes security hardening, remote access, firewall, and backups.

---

## Overview: two ways to run MySQL on Kamatera

| Option | Description |
|--------|-------------|
| **A. MySQL app image** | Preconfigured Ubuntu + MySQL. Fastest start; MySQL is already installed. |
| **B. Plain Ubuntu + install MySQL** | You control version and config from scratch. |

Both run on a Kamatera cloud server. For a “proper” production instance we then harden MySQL, restrict access, and configure backups.

---

## Part 1: Create the server on Kamatera

### 1.1 Account and console

- Go to [console.kamatera.com](https://console.kamatera.com), sign up, verify email, and log in.

### 1.2 Create server – Option A (MySQL app image)

1. **My Cloud → Servers → Create New Server**.
2. **Zone** – Pick a region (e.g. North America, Europe).
3. **Image** – Under **App Images**, choose a MySQL image:
   - `mysqlserver-8.0-ubuntuserver-24.04`, or
   - `mysqlserver-8.4.6-ubuntuserver-24.04`
4. **Type** – e.g. Type B (General Purpose) or Type T (Burst).
5. **Resources** – Minimum 1 vCPU, 2 GB RAM, 30 GB NVMe for a small production DB; scale up as needed.
6. **Networking** – Enable **Public Internet** (required for remote MySQL access).
7. **Extended daily backup** – Enable for automated backups.
8. **Managed service** (optional) – Enable if you want Kamatera to manage the OS.
9. **Finalize** – Set a strong **root password** (14+ chars, mixed case, numbers, symbols), server name, then **Create Server**.

Skip to **Part 2** once the server is ready.

### 1.3 Create server – Option B (plain Ubuntu, install MySQL yourself)

1. **My Cloud → Servers → Create New Server**.
2. **Zone** – Choose region.
3. **Image** – **Server OS Images → Ubuntu Server** (e.g. 24.04 LTS).
4. **Type / Resources / Networking** – Same as above (e.g. 1 vCPU, 2 GB RAM, 30 GB NVMe, Public Internet).
5. **Finalize** – Set root password, name, **Create Server**.

Then SSH in and install MySQL:

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
```

Continue with **Part 2** to harden and configure this instance.

---

## Part 2: Harden MySQL (proper production setup)

SSH into the server (use the **Public IP** from **My Cloud → Servers**):

```bash
ssh root@YOUR_SERVER_IP
```

### 2.1 Run the security script (Option B, or if your app image supports it)

For a fresh install (Option B), run:

```bash
sudo mysql_secure_installation
```

- Set a **strong root password** (or keep existing if already set).
- **Remove anonymous users:** Yes.
- **Disallow root login remotely:** Yes (we use a dedicated app user for remote access).
- **Remove test database:** Yes.
- **Reload privilege tables:** Yes.

For **Option A** (app image), the image may already have done some of this; if the script is available, run it and follow the same answers.

### 2.2 Create the application database and a restricted user

Log into MySQL. On Ubuntu, root often uses `auth_socket`, so **try without a password first**:

```bash
sudo mysql
```

If you get **"Access denied for user 'root'@'localhost'"** when using `mysql -u root -p`, use `sudo mysql` (no `-p`) instead — your system root login is used to authenticate. Once inside, you can set a MySQL root password if you want — run **one line at a time** (if you see a `->` or `'>` arrow, type `\c` and Enter to cancel). Use a password that does not contain a single quote `'`:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'YourPassword';
FLUSH PRIVILEGES;
```

(Omitting `IDENTIFIED WITH ...` uses the server default auth plugin. If you see "Plugin 'mysql_native_password' is not loaded", use the form above without `WITH mysql_native_password`. If you see **"Operation ALTER USER failed for 'root'@'localhost'" (1396)**, the root account may be set up differently: run `SELECT user, host, plugin FROM mysql.user;` and use the exact `user@host` shown (e.g. `'root'@'127.0.0.1'`). You can also skip setting a root password and just create the app database and `pinkaroo` user below — you are already in as root via `sudo mysql`.)

If your image or install uses a password for root, use:

```bash
sudo mysql -u root -p
```

In the MySQL shell:

```sql
-- Database with correct charset for Prisma/apps
CREATE DATABASE pinkaroo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Application user: never use root from your app
-- For production: restrict to your app server IP (see below)
CREATE USER 'pinkaroo'@'%' IDENTIFIED BY 'YOUR_STRONG_APP_PASSWORD';

-- Principle of least privilege: only this database
GRANT ALL PRIVILEGES ON pinkaroo_db.* TO 'pinkaroo'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Use a **strong password** for `YOUR_STRONG_APP_PASSWORD` (e.g. 16+ chars, mixed case, numbers, symbols).

**Production:** Restrict the user to your app server IP instead of `'%'`:

```sql
-- Replace 203.0.113.10 with your app server’s IP
CREATE USER 'pinkaroo'@'203.0.113.10' IDENTIFIED BY 'YOUR_STRONG_APP_PASSWORD';
GRANT ALL PRIVILEGES ON pinkaroo_db.* TO 'pinkaroo'@'203.0.113.10';
FLUSH PRIVILEGES;
```

If you already created `'pinkaroo'@'%'`, remove it and recreate with the IP:

```sql
DROP USER IF EXISTS 'pinkaroo'@'%';
```

### 2.3 Allow remote connections (bind-address)

By default MySQL often listens only on `127.0.0.1`. To allow your app (on another server or your laptop) to connect, we bind to all interfaces but **rely on the firewall** to limit who can reach port 3306.

Back up and edit the config (path common on Ubuntu):

```bash
sudo cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/mysql.conf.d/mysqld.cnf.bak
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Find:

```ini
bind-address = 127.0.0.1
```

Change to:

```ini
bind-address = 0.0.0.0
```

Save, then restart MySQL:

```bash
sudo systemctl restart mysql
```

Only do this if you will restrict port 3306 with a firewall (next step). Never expose 3306 to the whole internet without restrictions.

### 2.4 Firewall: restrict port 3306 (proper setup)

**Do not open MySQL to 0.0.0.0/0.** Use UFW to allow only your app server(s) or your office IP.

```bash
# Enable UFW if not already
sudo ufw status
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH – keep this
```

Then **one** of the following:

**A) Allow only your app server IP (recommended for production):**

```bash
sudo ufw allow from YOUR_APP_SERVER_IP to any port 3306
```

**B) Allow only your current IP (e.g. for dev from your laptop):**

```bash
sudo ufw allow from YOUR_CURRENT_IP to any port 3306
```

**C) Development only – allow anywhere (not for production):**

```bash
sudo ufw allow 3306/tcp
```

Then enable and reload:

```bash
sudo ufw enable
sudo ufw reload
sudo ufw status
```

---

## Part 3: Connect from the Pinkaroo portal

In the project `.env`:

```env
DATABASE_URL="mysql://pinkaroo:YOUR_STRONG_APP_PASSWORD@YOUR_SERVER_IP:3306/pinkaroo_db"
```

Replace:

- `YOUR_STRONG_APP_PASSWORD` – password for the `pinkaroo` user.
- `YOUR_SERVER_IP` – Kamatera server **Public IP**.

From the project root:

```bash
npx prisma migrate deploy
npm run db:seed
```

For local development you can use `npx prisma migrate dev` instead of `migrate deploy`.

### Changing the pinkaroo user password

On the MySQL server, connect as root then run (use the same host as when you created the user, e.g. `'%'` or your app IP):

```sql
ALTER USER 'pinkaroo'@'%' IDENTIFIED BY 'YourNewPassword';
FLUSH PRIVILEGES;
```

Update `DATABASE_URL` in `.env` with the new password and restart the app.

---

## Part 4: Backups (proper instance care)

### 4.1 Kamatera daily backups

If you enabled **Extended daily backup** when creating the server, Kamatera backs up the whole server (including MySQL data). You can restore from the console.

### 4.2 MySQL logical backups (optional, recommended)

Add a cron job to dump the database and store or ship the files elsewhere:

```bash
sudo mkdir -p /var/backups/mysql
sudo nano /usr/local/bin/backup-pinkaroo-db.sh
```

Paste (adjust DB name and user if different):

```bash
#!/bin/bash
set -e
BACKUP_DIR="/var/backups/mysql"
DB_NAME="pinkaroo_db"
DATE=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/${DB_NAME}-${DATE}.sql.gz"

# Use the app user or a dedicated backup user with SELECT, LOCK TABLES
mysqldump -u pinkaroo -p'YOUR_STRONG_APP_PASSWORD' --single-transaction --routines "$DB_NAME" | gzip > "$FILE"
# Keep last 7 days
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-pinkaroo-db.sh
```

Run daily via cron (e.g. 2 AM):

```bash
sudo crontab -e
# Add:
0 2 * * * /usr/local/bin/backup-pinkaroo-db.sh
```

For production, use a dedicated MySQL user with only the needed privileges (e.g. SELECT, LOCK TABLES) and store the password in a secure config file with restricted permissions instead of the script.

---

## Checklist: proper MySQL instance on Kamatera

| Step | Action |
|------|--------|
| 1 | Create server (MySQL app image **or** Ubuntu + install MySQL). |
| 2 | Enable **Extended daily backup** and strong root password. |
| 3 | Run `mysql_secure_installation` (if available). |
| 4 | Create app database and **restricted user** (not root). |
| 5 | Prefer user with **specific IP** (`'user'@'app_ip'`) in production. |
| 6 | Set `bind-address = 0.0.0.0` only when using a firewall. |
| 7 | Restrict **port 3306** with UFW to app IP(s) or your IP. |
| 8 | Set **DATABASE_URL** in the app and run **Prisma migrate** (and seed). |
| 9 | Add **logical backups** (cron + mysqldump) and/or rely on Kamatera backups. |

---

## References

- [Kamatera MySQL service](https://kamatera.com/services/mysql/)
- [How to manage MySQL on Kamatera](https://kamatera.com/knowledgebase/how-to-manage-mysql-databases-on-kamatera/)
- [How to relocate MySQL data directory (Ubuntu)](https://www.kamatera.com/knowledgebase/how-to-relocate-a-mysql-data-directory/)
