# Alcioni Esteves — Psicoterapeuta (site + editor visual)

Site em **PHP + Tailwind (CDN) + JavaScript**, **sem banco de dados**. Todo o conteúdo fica em `data/site.json`;
as imagens em `uploads/`. O painel em **`/admin/`** é um editor visual no estilo Elementor: o cliente edita textos,
imagens, cores, espaçamentos, colunas e seções e vê o resultado ao vivo em Desktop / Tablet / Celular.

## Requisitos
PHP 8.1+ (extensões `gd`, `fileinfo`, `dom`, `mbstring`). Apache (`.htaccess` incluso) ou Nginx.
As pastas `data/` e `uploads/` precisam ser **graváveis** pelo PHP.

## Rodar localmente
```bash
php -S localhost:8000 router.php
# site:   http://localhost:8000/
# painel: http://localhost:8000/admin/
```

## Primeiro acesso ao painel
Ao abrir `/admin/` pela primeira vez, defina **usuário e senha** (mín. 10 caracteres). **Faça isso logo após publicar**.
Esqueceu a senha? `php tools/set-password.php USUARIO NOVASENHA`.

## O que o editor faz
- **Estrutura**: árvore Seção → Coluna → Elemento; arraste para reordenar (inclusive entre colunas), duplique, exclua.
- **Elementos**: título, texto rico, imagem, botão, caixa de ícone, galeria (com ampliação), lista, vídeo, redes sociais, sanfona/FAQ, espaçador, divisor, HTML livre.
- **Editar**: propriedades da seção/coluna/elemento. Campos com selo *Desktop/Tablet/Celular* têm valor **por dispositivo** (largura das colunas, tamanhos, espaçamentos, ordem, ocultar…).
- **Site**: título/SEO, imagem de compartilhamento, cores e fontes globais, cabeçalho/menu (automático a partir das seções), auto-scroll.
- **Mídia**: envio por arrastar-e-soltar (otimiza imagens grandes), biblioteca e exclusão.
- **Versões anteriores**: as últimas 30 versões salvas ficam em `data/backups/` e podem ser restauradas.
- Atalhos: `Ctrl+S` salvar, `Ctrl+Z` / `Ctrl+Y` desfazer/refazer.

## Imagens: controle total
Em *Editar → Imagem*: largura, altura e proporção da **moldura** (por dispositivo), encaixe, zoom, posição e **ponto de foco clicável**,
e a **forma** (4 cantos individuais + formatos prontos: folha, arco, pílula, círculo). O painel pode ser recolhido (tecla `[`) e redimensionado.

## Site público
Tipografia: Playfair Display (títulos) + Nunito Sans (texto), trocáveis em *Site → Fontes*. Menu escondido no topo (aparece ao rolar). Animações de entrada por elemento, **auto-scroll por seção** (desktop; liga/desliga em *Site*), pontos de navegação laterais,
menu hambúrguer no celular, cabeçalho que ganha fundo ao rolar, parallax opcional, lightbox na galeria. Respeita `prefers-reduced-motion`.

## Estrutura
```
index.php            página pública (renderiza data/site.json)
inc/lib.php          armazenamento JSON, sanitização, login
inc/render.php       renderizador de seções/colunas/elementos + CSS responsivo
assets/              site.css / site.js (público)
admin/               login, api, preview e editor (editor.js / editor.css)
data/site.json       TODO o conteúdo do site
uploads/             imagens
tools/set-password.php
```

## Segurança (resumo)
Senha com `password_hash`, sessão HttpOnly/SameSite, token CSRF em todas as gravações, limite de tentativas de login,
HTML do editor higienizado no servidor, uploads validados por tipo real (SVG limpo de scripts), `data/` e `uploads` sem execução de PHP
(`.htaccess`). **Nginx**: bloqueie `/data`, `/inc`, `/tools` e PHP em `/uploads`.
O widget "HTML livre" aceita código arbitrário — disponível apenas a quem está logado.

## Observações
- Tailwind, Font Awesome e Google Fonts são carregados por CDN (requer internet no visitante).
- O conteúdo foi migrado do WordPress/Elementor (página "Novo Site"). Os depoimentos são imagens (como no original).
- Imagens do zip de **2024** (fotos das seções "Como funciona", "Benefícios" e "On-line") não vieram no upload; foram usadas fotos equivalentes de 2025 — troque-as em *Editar → Imagem* quando quiser.
