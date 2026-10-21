# Stage 1: compilar assets de Vite
FROM node:22-alpine AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.js ./
COPY resources ./resources
RUN npm run build

# Stage 2: aplicación Laravel
FROM php:8.4-apache AS app

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    MYSQL_ATTR_SSL_CA=/var/www/html/certs/aiven-ca.pem

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip libpq-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# DocumentRoot y AllowOverride (para que funcione el .htaccess de Laravel)
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    && sed -ri -e 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY --from=frontend /app/public/build ./public/build
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# Script de arranque: puerto de Render + migraciones
RUN printf '%s\n' \
    '#!/bin/sh' \
    'port="${PORT:-8080}"' \
    'sed -i "s/Listen 80/Listen ${port}/" /etc/apache2/ports.conf' \
    'sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${port}>/" /etc/apache2/sites-available/*.conf' \
    'php artisan config:clear' \
    'php artisan migrate --force || echo "AVISO: la migracion fallo, revisa la conexion a la DB"' \
    'exec apache2-foreground' \
    > /usr/local/bin/start.sh \
    && chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
