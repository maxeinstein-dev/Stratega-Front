# Stratega Frontend

O **Stratega** é uma plataforma moderna de gestão financeira pessoal e coletiva, focada em simplicidade, elegância e controle total sobre o seu patrimônio.

Esta versão do frontend foi completamente modernizada e refatorada para uma arquitetura baseada em **Features**, utilizando as tecnologias mais recentes do ecossistema React.

## 🚀 Tecnologias Utilizadas

- **React 19**
- **React Router v7** (Navegação padrão e robusta)
- **Vanilla JavaScript** (Sem TypeScript para maior simplicidade de desenvolvimento)
- **Tailwind CSS v4** (Estilização de alta performance com engine Lightning CSS)
- **TanStack Query v5** (Gerenciamento de estado de servidor e cache)
- **Lucide React** (Ícones modernos)
- **Recharts** (Gráficos financeiros dinâmicos)
- **Shadcn UI** (Componentes de interface premium)

## 📂 Estrutura do Projeto

```text
src/
├── components/     # Componentes de UI e utilitários globais
├── core/           # Lógica central (Auth, API Client, Contextos)
├── features/       # Módulos de negócio (Domínios)
│   ├── auth/       # Login e Registro
│   ├── dashboard/  # Resumos e Gráficos avançados
│   ├── wallets/    # Gestão de Contas e Moedas
│   ├── transactions/# Histórico, Importação e Exportação
│   ├── budgets/    # Planejamento e Metas de Gastos
│   ├── goals/      # Objetivos de Poupança
│   └── groups/     # Despesas Coletivas e Divisões
├── layouts/        # Estruturas de página (Main Shell, Auth Shell)
├── main.jsx        # Ponto de entrada
└── App.jsx         # Definição de rotas e providers
```

## ✨ Funcionalidades Principais

1.  **Dashboard Analítico e Gráficos Recharts**: Filtros interativos de período (30, 90, 180, 365 dias), comparativos lado-a-lado de Faturamento x Despesas e Linhas de Evolução de Poupança.
2.  **Gestão de Carteiras**: Suporte a múltiplas moedas (BRL, USD, EUR, BTC) e saldos em tempo real.
3.  **Controle de Orçamentos (Budgets)**: Defina limites por categoria e acompanhe com gráficos Projetado x Realizado.
4.  **Objetivos de Poupança**: Defina metas de longo prazo (ex: Viagem) e adicione fundos controlando seu progresso via Dashboard.
5.  **Despesas de Grupo**: Divida contas com amigos, acompanhe quem deve a quem e liquide dívidas injetando o saldo diretamente em suas carteiras.
5.  **Importação/Exportação**: Suporte a extratos CSV/OFX para facilitar a conciliação bancária.
6.  **Notificações Inteligentes**: Alertas in-app sobre orçamentos excedidos e novas interações.

## 🛠️ Novidades e Estabilidade ✅

Recentemente, o frontend recebeu melhorias críticas de robustez:
- **Gestão de Grupos**: Adicionada funcionalidade de exclusão de grupos e visualização de detalhes em tempo real.
- **Importação de Dados**: Correção do envio de arquivos (Multipart/Form-Data) para suporte total a OFX e CSV.
- **Acessibilidade**: Resolução de avisos do Radix UI/Shadcn (DialogDescription) para uma navegação mais semântica.
- **Login Fluido**: Correção de erros de referência no fluxo de persistência de usuário.

## 🛠️ Como Executar

1.  Clone o repositório.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure a URL da API no arquivo `.env` ou use o proxy padrão (`localhost:8081`):
    ```env
    VITE_API_BASE_URL=http://seu-backend-url/api
    ```
4.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

## 📄 Licença

Este projeto é de uso privado para a plataforma Stratega.
