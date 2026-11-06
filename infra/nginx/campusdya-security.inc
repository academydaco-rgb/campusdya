# /etc/nginx/snippets/campusdya-security.inc
# Se incluye DENTRO del bloque `server { listen 443 ... server_name api.campusdya.com; }`
limit_conn cdya_conn 40;

# Bloquea escáneres y rutas que no existen en esta API (wp-admin, .env, .git, phpmyadmin…)
location ~* (\.env|\.git|\.svn|\.htaccess|wp-admin|wp-login|xmlrpc\.php|phpmyadmin|\.php$|/cgi-bin/) { return 444; }

# Solo métodos que usa la API
if ($request_method !~ ^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$) { return 405; }

# Login y recuperación de contraseña: freno fuerte contra fuerza bruta
location ~ ^/api/auth/(login|forgot-password|reset-password) {
    limit_req zone=cdya_auth burst=30 nodelay;
    limit_req_status 429;
    proxy_pass http://127.0.0.1:8010;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Archivos subidos: nunca se ejecutan, solo se sirven
location /static/ {
    limit_req zone=cdya_api burst=60 nodelay;
    add_header X-Content-Type-Options "nosniff" always;
    proxy_pass http://127.0.0.1:8010;
    proxy_set_header Host      $host;
    proxy_set_header X-Real-IP $remote_addr;
}
