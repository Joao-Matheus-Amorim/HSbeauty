import { test, expect } from '@playwright/test';

async function mockPublicServices(page) {
  await page.route('**/servicos*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, nome: 'Unhas', duracao: 60, preco: 60, ativo: true },
        { id: 2, nome: 'Cilios', duracao: 30, preco: 50, ativo: true },
        { id: 3, nome: 'Sobrancelhas', duracao: 40, preco: 45, ativo: true },
        { id: 4, nome: 'Depilacao', duracao: 20, preco: 35, ativo: true },
      ]),
    });
  });
}

async function mockAdminApis(page) {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        admin: { id: 1, nome: 'Admin', email: 'admin@hsbeauty.com' },
      }),
    });
  });

  await page.route('**/admin/agendamentos*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        agendamentos: [
          {
            id: 1,
            nomeCliente: 'Ana Lima',
            telefone: '(21) 99999-7777',
            data: '2026-05-27T09:00:00.000Z',
            hora: '09:00',
            status: 'pendente',
            servico: { id: 1, nome: 'Unhas', preco: 60 },
          },
        ],
        paginacao: { pagina: 1, totalPaginas: 1, total: 1 },
      }),
    });
  });

  await page.route('**/admin/servicos*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        servicos: [
          {
            id: 1,
            nome: 'Unhas',
            descricao: 'Servico de unhas',
            preco: 60,
            duracao: 60,
            categoria: 'Unhas',
            ativo: true,
          },
        ],
        paginacao: { pagina: 1, totalPaginas: 1, total: 1 },
      }),
    });
  });

  await page.route('**/admin/horarios*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        horarios: [
          {
            id: 1,
            dataInicio: '2026-05-28T09:00:00.000Z',
            dataFim: '2026-05-28T12:00:00.000Z',
            horaInicio: '09:00',
            horaFim: '12:00',
            motivo: 'Ajuste interno',
          },
        ],
        paginacao: { pagina: 1, totalPaginas: 1, total: 1 },
      }),
    });
  });

  await page.route('**/admin/dashboard*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        resumo: {
          agendamentosHoje: 3,
          receitaMes: 1250.5,
          totalServicos: 6,
          totalAgendamentos: 12,
        },
        statusCount: {
          pendente: 2,
          confirmado: 5,
          concluido: 4,
          cancelado: 1,
        },
        topServicos: [
          { nome: 'Unhas', quantidade: 6 },
          { nome: 'Cilios', quantidade: 4 },
          { nome: 'Sobrancelhas', quantidade: 2 },
        ],
      }),
    });
  });
}

test('visual: home publica', async ({ page }) => {
  await mockPublicServices(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByLabel('Landing page HSBeauty')).toBeVisible();
  await expect(page).toHaveScreenshot('public-home.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('visual: login admin', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /entrar no painel/i })).toBeVisible();
  await expect(page).toHaveScreenshot('admin-login.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('visual mobile: painel logado tabs principais', async ({ page }) => {
  await mockAdminApis(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/admin');
  await page.getByLabel('Email').fill('admin@hsbeauty.com');
  await page.getByLabel('Senha').fill('123456');
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page.getByText('Ana Lima')).toBeVisible();
  await expect(page).toHaveScreenshot('admin-mobile-agendamentos.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.05,
  });

  await page.getByRole('button', { name: /servi/i }).click();
  await expect(page.getByRole('button', { name: /novo/i })).toBeVisible();
  await expect(page).toHaveScreenshot('admin-mobile-servicos.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.05,
  });

  await page.getByRole('button', { name: /hor/i }).click();
  await expect(page.getByRole('button', { name: /bloquear/i })).toBeVisible();
  await expect(page).toHaveScreenshot('admin-mobile-horarios.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.05,
  });

  await page.getByRole('button', { name: /resumo/i }).click();
  await expect(page.getByText('Serviços Populares')).toBeVisible();
  await expect(
    page.locator('.admin-content > div > div').first()
  ).toHaveScreenshot('admin-mobile-dashboard.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('visual mobile: erro em agendamentos', async ({ page }) => {
  await mockAdminApis(page);
  await page.route('**/admin/agendamentos*', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ erro: 'Erro ao carregar agendamentos' }),
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');
  await page.getByLabel('Email').fill('admin@hsbeauty.com');
  await page.getByLabel('Senha').fill('123456');
  await page.getByRole('button', { name: /^entrar$/i }).click();

  await expect(page.getByText(/erro ao carregar agendamentos/i)).toBeVisible();
  await expect(page).toHaveScreenshot('admin-mobile-agendamentos-erro.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.05,
  });
});
