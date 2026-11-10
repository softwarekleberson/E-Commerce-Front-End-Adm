# Hatchards Admin Frontend

Frontend administrativo de uma loja/loja de varejo para gerenciamento de produtos, estoque, pedidos, clientes e trocas. A aplicação é construída em HTML, CSS e JavaScript puro, com autenticação por token no `localStorage` e comunicação com uma API backend em `http://localhost:8080`.

## Visão geral

Este projeto oferece uma interface para:

- autenticação de administrador
- cadastro e manutenção de produtos
- gestão de estoque
- ativação/desativação de produtos
- alteração de preço de venda
- listagem e acompanhamento de pedidos
- movimentação de pedidos entre status (separação, trânsito, entrega)
- cadastro e listagem de clientes
- dashboard de vendas e indicadores
- aprovação/negação de solicitações de troca

## Tecnologias

- HTML5
- CSS3
- JavaScript ES6+
- Playwright para testes de interface
- Servidor estático Python (`python3 -m http.server`)

## Estrutura do projeto

```text
.
├── index.html                     # página inicial / menu administrativo
├── login.html                     # login do administrador
├── dashboard.html                 # dashboard de vendas
├── stock.html                     # gestão de estoque
├── list-orders.html               # listagem de pedidos
├── list-customer.html             # listagem de clientes
├── insert-product.html            # cadastro de produto
├── update-product.html            # atualização de produto
├── modify-selling-price.html      # ajuste de preço
├── activate-product.html          # ativar produtos
├── deactivate-product.html        # desativar produtos
├── exchange.html                  # trocas
├── delete-orders.html             # exclusão de pedidos
├── adm/                          # administração geral
├── adm-transito/                 # fluxo de pedidos em trânsito
├── activate-product/              # scripts de ativação
├── deactivate-product/            # scripts de desativação
├── css-global/                   # estilos globais
├── exchange/                     # estilos específicos de troca
├── index/                        # estilos da home
├── list-customer/               # módulo de clientes
├── list-orders/                 # módulo de pedidos
├── login-adm/                   # fluxo de login
├── order/                       # scripts de pedidos/status
├── product/                     # scripts de produtos
├── replacement/                 # trocas/solicitações
├── separation/                  # estilos de separação
├── status-customer/             # alteração de status do cliente
├── stock/                      # gestão de estoque
├── tests/                      # testes automatizados com Playwright
├── playwright.config.js        # configuração dos testes
├── como rodar o teste.txt       # instruções rápidas para testes
└── README.md
```

## Requisitos

Antes de executar a aplicação, certifique-se de que o backend esteja rodando e acessível em:

- `http://localhost:8080`

Além disso, a aplicação exige que o usuário tenha um token de autenticação válido gerado pelo backend.

## Como executar

1. Inicie o backend da aplicação (API) na porta `8080`.
2. No diretório do projeto, execute:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

3. Abra no navegador:

```text
http://127.0.0.1:4173/login.html
```

4. Faça login com as credenciais de administrador configuradas no backend.

> A aplicação salva o token em `localStorage` e redireciona para a página principal após o login bem-sucedido.

## Testes

O projeto possui testes automatizados com Playwright. Para rodá-los:

1. Instale as dependências do Playwright, se ainda não estiverem disponíveis:

```bash
npm install --save-dev @playwright/test
```

2. Execute os testes:

```bash
npx playwright test
```

3. Para rodar um cenário específico:

```bash
npx playwright test tests/exchange/accept.spec.js --headed
```

Ou, conforme indicado no arquivo `como rodar o teste.txt`:

```bash
npx playwright test --headed
```

## Observações importantes

- A configuração dos testes usa `http://127.0.0.1:4173` como base URL.
- O servidor web para os testes é iniciado automaticamente pelo Playwright com o comando:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

- A maioria das telas usa requisições `fetch` para endpoints da API, com o header de autenticação e o token armazenado no navegador.

## Fluxo principal

A aplicação é composta principalmente por páginas administrativas, cada uma conectada a uma funcionalidade do sistema:

- `index.html`: painel inicial com acesso rápido às principais operações
- `login.html`: autenticação do administrador
- `dashboard.html`: indicadores e métricas de vendas
- `list-orders.html` / `stock.html`: monitoramento de pedidos e estoque
- `product` e `stock`: cadastro, ajuste de produto e controle de movimentações
- `exchange.html` e `replacement/`: gerenciamento de trocas

## Licença

Este projeto não informa uma licença específica no repositório. Consulte o proprietário do código antes de reutilizar em produção, distribuição ou publicação pública.

## Contribuição

Como o projeto é uma aplicação administrativa interna, qualquer alteração deve ser validada com as telas e fluxos relevantes, além dos testes automatizados, principalmente em áreas de autenticação, estoque, pedidos e trocas.
