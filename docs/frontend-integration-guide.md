# 📄 Especificação Técnica para Desenvolvimento Frontend - Stratega API
 
Este documento descreve as funcionalidades, regras de negócio e endpoints da API **Stratega**, fornecendo todo o contexto necessário para a construção de uma interface frontend moderna e funcional.
 
---
 
## 🚀 Visão Geral do Sistema
O **Stratega** é um sistema de gestão financeira pessoal e em grupo. Ele permite que usuários controlem suas próprias carteiras e participem de grupos de despesas compartilhadas com algoritmos de liquidação de dívidas.
 
---
 
## 🔐 Autenticação e Segurança
A API utiliza **JWT (JSON Web Token)** para segurança.
- **Header:** `Authorization: Bearer <TOKEN>`
- **Identidade Automática:** A API identifica o usuário logado através do token. Não é necessário enviar IDs de usuário manualmente nos headers ou no corpo das requisições principais.
- **Endpoints Públicos:** `/api/auth/register` e `/api/auth/login`.
- **Endpoints Protegidos:** Todos os demais requerem o token.
 
---
 
## 📂 Módulos e Endpoints
 
### 1. Autenticação (`/api/auth`)
Gerencia o acesso dos usuários.
 
*   **POST `/api/auth/register`**
    *   **Body:** `{ "name": "...", "email": "...", "password": "..." }`
    *   **Response:** `201 Created` - `{ "id": "...", "name": "...", "email": "..." }`
    *   **Nota:** Ao registrar, uma carteira padrão chamada "Minha Carteira" é criada automaticamente para o usuário.
*   **POST `/api/auth/login`**
    *   **Body:** `{ "email": "...", "password": "..." }`
    *   **Response:** `200 OK` - `{ "accessToken": "..." }`
 
---
 
### 2. Carteiras (`/api/wallets`)
Representam contas bancárias, dinheiro em espécie ou cartões de crédito.
 
*   **POST `/api/wallets`**
    *   Cria uma nova carteira para o usuário logado.
    *   **Body:** `{ "name": "...", "initialBalance": 0.0, "currency": "USD" }`
    *   **Response:** `201 Created` - `{ "id": "...", "name": "...", "balance": 0.0, "currency": "USD", "userId": "..." }`
*   **GET `/api/wallets`**
    *   Retorna a lista de carteiras do usuário logado.
    *   **Response:** `200 OK` - `[ { "id": "...", "name": "...", "balance": 0.0, "currency": "BRL", "userId": "..." } ]`
    *   **Moedas Suportadas:** `BRL`, `USD`, `EUR`, `GBP`, `BTC`.
 
---
 
### 3. Transações (`/api/transactions`)
Movimentações financeiras individuais.
 
*   **POST `/api/transactions`**
    *   Cria uma receita (INCOME) ou despesa (EXPENSE). Atualiza automaticamente o saldo da carteira vinculada.
    *   **Body:** 
        ```json
        {
          "description": "Almoço",
          "amount": 25.50,
          "date": "2026-05-04T15:00:00",
          "type": "EXPENSE",
          "walletId": "<UUID>",
          "categoryId": "<UUID> (Opcional)"
        }
        ```
*   **GET `/api/transactions`**
    *   Retorna o histórico de transações do usuário logado (ordenado por data decrescente).
    *   **Response:** `200 OK` - `[ { "id": "...", "description": "Almoço", "amount": 25.50, "netAmount": 25.50, "date": "...", "type": "EXPENSE", ... } ]`
    *   **Nota:** O campo `netAmount` representa a cota real do usuário (relevante em despesas de grupo). Se for `null`, o valor real é o `amount`.
*   **DELETE `/api/transactions/{id}`**
    *   Exclui uma transação e **reverte automaticamente** o impacto no saldo da carteira.
    *   Se a transação for parte de uma transferência, ambas as pernas são excluídas e os saldos de ambas as carteiras são corrigidos.
    *   **Response:** `204 No Content`
*   **POST `/api/transactions/transfer`**
    *   Realiza transferência entre duas carteiras do usuário logado.
    *   **Body:**
        ```json
        {
          "originWalletId": "<UUID>",
          "destinationWalletId": "<UUID>",
          "amount": 100.0,
          "description": "Reserva",
          "date": "2026-05-04T15:00:00"
        }
        ```
*   **PUT `/api/transactions/{id}`**
    *   Edita uma transação existente. Permite alterar `walletId`, `categoryId`, `amount`, `date` e `description`. O `type` é imutável.
    *   **Body:**
        ```json
        {
          "description": "Novo Almoço",
          "amount": 30.00,
          "date": "2026-05-04T15:00:00",
          "walletId": "<UUID>",
          "categoryId": "<UUID> (Opcional)"
        }
        ```
 
---
 
### 4. Despesas em Grupo (`/api/groups`)
Módulo social para dividir contas entre amigos ou familiares.
 
*   **POST `/api/groups`**
    *   Cria um grupo. O usuário logado é definido automaticamente como o dono (`owner`) e também é adicionado como o primeiro membro do grupo.
    *   **Body:** `{ "name": "Viagem", "memberNames": ["Alice", "Bob"] }`
*   **GET `/api/groups`**
    *   Retorna a lista de grupos em que o usuário logado é o dono ou um membro.
    *   **Response:** `200 OK` - `[ { "id": "...", "name": "Viagem", "ownerId": "...", "members": [...] } ]`
*   **GET `/api/groups/{groupId}`**
    *   Retorna os detalhes completos de um grupo específico.
    *   **Response:** `200 OK` - `{ "id": "...", "name": "Viagem", "ownerId": "...", "members": [...] }`
*   **DELETE `/api/groups/{groupId}`**
    *   Exclui um grupo. Apenas o dono (`owner`) tem permissão para esta ação.
    *   **Response:** `204 No Content`
*   **POST `/api/groups/{groupId}/expenses`**
    *   Adiciona uma despesa ao grupo usando uma estratégia de divisão.
    *   **Estratégias (`splitType`):**
        1.  `UNIFORM`: Divide igualmente entre todos os membros.
        2.  `EXACT`: Cada membro paga um valor fixo.
        3.  `PERCENTAGE`: Divisão por porcentagem (deve somar 100%).
        4.  `SHARE`: Divisão por cotas (ex: Pessoa A tem 2 partes, Pessoa B tem 1).
    *   **Body:**
        ```json
        {
          "description": "Jantar",
          "amount": 150.0,
          "paidByMemberId": "<UUID>",
          "date": "2026-05-04T19:30:00",
          "splitType": "UNIFORM",
          "splitValues": {} 
        }
        ```
*   **GET `/api/groups/{groupId}/balances`**
    *   Retorna o balanço de cada membro e as **transferências sugeridas**.
*   **POST `/api/groups/{groupId}/settle`**
    *   Realiza a liquidação de uma dívida (Settle Debt).
    *   **Duplo Impacto:** Registra a quitação no grupo e **injeta o saldo** na carteira escolhida pelo usuário.
    *   **Body:**
        ```json
        {
          "memberId": "<UUID do Membro que está pagando>",
          "amount": 50.00,
          "destinationWalletId": "<UUID da sua carteira que receberá o valor>",
          "description": "Acerto de contas (Opcional)"
        }
        ```
    *   **Response:** `204 No Content`
 
---
 
*   **GET `/api/groups/{groupId}/movements`**
    *   Retorna o histórico completo de movimentações do grupo (despesas e acertos de contas).
    *   **Response:** `200 OK`
        ```json
        [
          {
            "id": "<UUID>",
            "description": "Jantar",
            "amount": 150.0,
            "type": "EXPENSE",
            "date": "2026-05-06T20:00:00",
            "paidByName": "Alice",
            "paidByMemberId": "<UUID>"
          }
        ]
        ```
    *   **Nota:** O campo `type` pode ser `EXPENSE` (gasto compartilhado) ou `SETTLEMENT` (acordo/liquidação de dívida).

---

### 5. Integração Transversal: Grupos & Carteiras
As atividades no módulo de Grupos agora impactam automaticamente o extrato geral e o saldo das carteiras do usuário.

1.  **Lançamento de Despesa:** Ao lançar uma despesa de grupo informando um `walletId`, o valor total é debitado da carteira do pagador e uma transação de `type: EXPENSE` é criada no seu extrato geral vinculada ao grupo (`groupId`).
2.  **Extrato Unificado:** Ao listar transações gerais (`GET /api/transactions`), o usuário verá:
    *   Seus gastos individuais.
    *   Gastos de grupo onde ele foi o pagador (valor total debitado).
    *   **Transações Virtuais:** Participações em gastos de grupo onde ele **não** foi o pagador. Estas aparecem com descrição prefixada por "Grupo: " e o `netAmount` reflete apenas a sua cota na divisão.
3.  **Liquidação de Dívida:** Ao realizar um `settle`, o valor entra como uma receita na carteira escolhida e aparece no extrato geral.

---

### 6. Dashboard Analítico (`/api/dashboard`)
Fornece resumos agregados para a tela inicial.
 
*   **GET `/api/dashboard/summary?month=5&year=2026`**
    *   Os parâmetros `month` e `year` são opcionais (por padrão retorna todas).
    *   **Response:** `200 OK`
        ```json
        {
          "totalIncome": 5000.00,
          "totalExpense": 1500.00,
          "balance": 3500.00,
          "expensesByCategory": {
            "Alimentação": 800.00,
            "Lazer": 700.00
          }
        }
        ```
    *   **Nota:** Os valores são automaticamente convertidos para a moeda base (BRL) usando taxas de câmbio atualizadas.
 
*   **GET `/api/dashboard/historical?days=180`**
    *   Retorna os saldos históricos (Receita, Despesa e Poupança acumulada) agrupados por períodos inteligentes (dia ou mês).
    *   **Response:**
        ```json
        {
          "periods": [
            { "periodLabel": "Mai/26", "income": 5000, "expense": 3000, "savings": 2000 }
          ]
        }
        ```

*   **GET `/api/dashboard/reports/trend?month=5&year=2026`**
    *   Retorna os gastos acumulados dia a dia para gráficos de linha.
    *   **Response:** `[ { "date": "2026-05-01", "amount": 50.00 }, ... ]`
 
*   **GET `/api/dashboard/reports/comparison?month=5&year=2026`**
    *   Compara o gasto de cada categoria com o mês anterior.
    *   **Response:** `{ "Alimentação": { "currentMonth": 800, "previousMonth": 750, "differencePercentage": 6.67 } }`
 
---
 
### 6. Notificações (`/api/notifications`)
Sistema de alertas automáticos (ex: limite de orçamento atingido).
 
*   **GET `/api/notifications`**
    *   Retorna a lista de notificações do usuário.
    *   **Response:** `[ { "id": "...", "title": "...", "message": "...", "isRead": false, "createdAt": "..." } ]`
*   **PATCH `/api/notifications/{id}/read`**
    *   Marca uma notificação como lida.
 
---
 
### 7. Metas Financeiras / Orçamentos (`/api/budgets`)
Define limites de gastos mensais por categoria.
 
*   **POST `/api/budgets`**
    *   Define ou atualiza a meta de uma categoria.
    *   **Body:** `{ "categoryId": "<UUID>", "amountLimit": 500.00, "month": 5, "year": 2026 }`
*   **GET `/api/budgets?month=5&year=2026`**
    *   Lista as metas do mês junto com o cálculo automático de consumo.
    *   **Response:** `200 OK`
        ```json
        [
          {
            "id": "...",
            "categoryId": "...",
            "categoryName": "Alimentação",
            "amountLimit": 500.00,
            "currentSpent": 450.00,
            "percentageUsed": 90.00,
            "isOverBudget": false,
            "month": 5,
            "year": 2026
          }
        ]
        ```
    *   **Nota:** O campo `isOverBudget` fica `true` automaticamente quando `percentageUsed >= 100`.
 
---
 
### 8. Objetivos de Poupança (`/api/goals`)
Define e acompanha metas de economia de longo prazo separadas do orçamento mensal.

*   **POST `/api/goals`**
    *   Cria um novo objetivo.
    *   **Body:** `{ "name": "Viagem Europa", "targetAmount": 15000.00, "deadline": "2027-01-01T00:00:00" }`
*   **GET `/api/goals`**
    *   Lista as metas e seus percentuais de conclusão.
    *   **Response:** `200 OK` - `[ { "id": "...", "name": "Viagem", "targetAmount": 15000, "currentAmount": 1500, "percentageCompleted": 10.0 } ]`
*   **POST `/api/goals/{goalId}/add-funds`**
    *   Adiciona dinheiro diretamente a uma meta de poupança (progresso).
    *   **Body:** `{ "amount": 500.00 }`

---
 
### 9. Importação e Exportação de Dados

*   **GET `/api/transactions/export?month=5&year=2026`**
    *   Exporta as transações do usuário no formato CSV. Os parâmetros `month` e `year` são opcionais.
    *   **Response:** `200 OK`
    *   **Headers:** `Content-Type: text/csv`, `Content-Disposition: attachment; filename=transactions.csv`
    *   O frontend pode processar essa resposta como um Blob e iniciar o download do arquivo automaticamente.

*   **POST `/api/transactions/import`**
    *   Importa um extrato bancário nos formatos **OFX** ou **CSV**.
    *   **Consumes:** `multipart/form-data`
    *   **Parâmetros (Form Data):**
        *   `file`: Arquivo `.ofx` ou `.csv`.
        *   `walletId`: UUID da carteira de destino.
    *   **Response:** `200 OK`
        ```json
        {
          "message": "Importação realizada com sucesso.",
          "importedTransactions": 15
        }
        ```
    *   **Nota:** As transações importadas virão sem Categoria associada (`categoryId = null`). O Front-end deve sugerir ao usuário classificar essas despesas manualmente.

---
 
## 💡 Notas para o Frontend
1.  **Imutabilidade:** O ID de um grupo ou transação nunca muda.
2.  **Membros Virtuais:** Membros de grupo podem não ter um `userId`. O frontend deve lidar com membros que são apenas strings.
3.  **Saldo:** A API permite saldos negativos em carteiras.
4.  **Autenticação**: O token deve ser enviado no header `Authorization` em todas as rotas protegidas.
5.  **Recorrência e Parcelamento:** Ao usar `installments` ou `recurringMonths` na criação de transações, a API retornará um Array com as `N` transações criadas e o saldo da carteira será impactado pelo valor de todas elas.
 
---
 
## 🎨 Sugestão de UI (User Experience)
*   **Dashboard:** Gráfico de receitas vs despesas e saldo total das carteiras.
*   **Módulo de Grupos:** Lista de grupos, indicador visual de "Você deve" ou "Te devem".
*   **Criação de Despesa:** Interface dinâmica baseada no `splitType` selecionado.
