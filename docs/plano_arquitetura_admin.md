# Plano de Arquitetura do Sistema Administrativo HSbeauty

Este documento detalha a arquitetura proposta para aprimorar o sistema administrativo do HSbeauty, focando na gestão de horários, serviços e um dashboard integrado.

## 1. Visão Geral

O objetivo é expandir as funcionalidades existentes do painel administrativo, proporcionando uma interface mais robusta e eficiente para gerenciar as operações do salão. Isso inclui aprimoramentos nas APIs de backend e nos componentes de frontend.

## 2. Backend (Node.js/Express com Prisma e PostgreSQL)

### 2.1. Modelos de Dados (Prisma Schema)

Com base na análise do `schema.prisma` existente, as seguintes modificações ou adições são propostas para suportar as novas funcionalidades:

*   **Serviço:** Adicionar campos para descrição detalhada, duração padrão, preço e categoria.
*   **Agendamento:** Adicionar campos para status (confirmado, pendente, cancelado), observações e link para o serviço.
*   **Usuário (Admin):** Garantir que o modelo de usuário existente possa ser estendido para incluir permissões de administrador, se necessário.

```prisma
// Exemplo de modificações no schema.prisma (a ser refinado)
model Service {
  id          String      @id @default(uuid())
  name        String      @unique
  description String?
  duration    Int         // Duração em minutos
  price       Decimal
  category    String?
  appointments Appointment[]
}

model Appointment {
  id        String    @id @default(uuid())
  date      DateTime
  time      String
  status    String    @default("pending") // pending, confirmed, cancelled
  notes     String?
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  serviceId String
  service   Service   @relation(fields: [serviceId], references: [id])
}

// O modelo User existente será mantido, com possível adição de um campo 'role' se necessário.
// model User { ... role String @default("user") }
```

### 2.2. Rotas da API (Express)

Serão criadas ou modificadas rotas para as seguintes funcionalidades:

*   **`GET /admin/dashboard`**: Retorna dados agregados para o dashboard (número de agendamentos, receita, serviços mais populares, etc.).
*   **`GET /admin/appointments`**: Lista todos os agendamentos, com filtros por data, status, serviço, etc.
*   **`GET /admin/appointments/:id`**: Detalhes de um agendamento específico.
*   **`PUT /admin/appointments/:id`**: Atualiza o status ou detalhes de um agendamento.
*   **`DELETE /admin/appointments/:id`**: Cancela/deleta um agendamento.
*   **`GET /admin/services`**: Lista todos os serviços.
*   **`GET /admin/services/:id`**: Detalhes de um serviço específico.
*   **`POST /admin/services`**: Cria um novo serviço.
*   **`PUT /admin/services/:id`**: Atualiza um serviço existente.
*   **`DELETE /admin/services/:id`**: Deleta um serviço.

### 2.3. Lógica de Negócio (Services/Controllers)

Os controladores e serviços de backend serão responsáveis por:

*   Validação de dados de entrada.
*   Interação com o banco de dados via Prisma.
*   Lógica para cálculo de métricas do dashboard.
*   Gerenciamento de erros e respostas padronizadas.

## 3. Frontend (React)

### 3.1. Estrutura de Componentes

O frontend será organizado em componentes reutilizáveis para cada seção do painel administrativo:

*   **`AdminLayout`**: Componente de layout principal com barra lateral de navegação e cabeçalho.
*   **`Dashboard`**: Componente principal do dashboard, exibindo métricas e gráficos.
*   **`AppointmentList`**: Componente para listar e gerenciar agendamentos.
*   **`AppointmentDetail`**: Componente para exibir e editar detalhes de um agendamento.
*   **`ServiceList`**: Componente para listar e gerenciar serviços.
*   **`ServiceForm`**: Componente para criar ou editar um serviço.
*   **`AuthGuard`**: Componente para proteger rotas administrativas (se ainda não existir).

### 3.2. Gerenciamento de Estado

Será utilizado o `useState` e `useEffect` do React para gerenciar o estado local dos componentes. Para estados globais ou mais complexos, pode-se considerar `useContext` ou uma biblioteca de gerenciamento de estado como Redux/Zustand, se a complexidade justificar.

### 3.3. Integração com a API

Serão criados módulos de serviço no frontend (ex: `api/adminAppointments.js`, `api/adminServices.js`) para encapsular as chamadas à API de backend, utilizando `axios` ou `fetch`.

### 3.4. Rotas do Frontend (React Router)

As rotas do frontend serão configuradas para navegar entre as diferentes seções do painel administrativo:

*   `/admin/dashboard`
*   `/admin/appointments`
*   `/admin/appointments/:id`
*   `/admin/services`
*   `/admin/services/new`
*   `/admin/services/edit/:id`

## 4. Considerações de Segurança

*   **Autenticação e Autorização:** Garantir que apenas usuários autenticados e com permissões de administrador possam acessar as rotas e funcionalidades do painel.
*   **Validação de Entrada:** Implementar validação robusta tanto no frontend quanto no backend para prevenir ataques como injeção de SQL e XSS.
*   **Variáveis de Ambiente:** Gerenciar credenciais e configurações sensíveis usando variáveis de ambiente.

## 5. Próximos Passos

1.  Atualizar o `schema.prisma` com os novos campos e modelos.
2.  Gerar as migrações do Prisma e aplicar no banco de dados.
3.  Implementar as novas rotas e controladores no backend.
4.  Desenvolver os componentes de frontend e integrar com as APIs.
5.  Realizar testes unitários e de integração.
6.  Implantar as mudanças no ambiente de produção.
