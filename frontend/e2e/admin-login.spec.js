import { test, expect } from '@playwright/test';

test('admin: login e carregamento inicial do painel', async ({ page }) => {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        admin: { id: 1, email: 'admin@hsbeauty.com' },
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
      body: JSON.stringify({ servicos: [], paginacao: { pagina: 1, totalPaginas: 1, total: 0 } }),
    });
  });

  await page.route('**/admin/horarios*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ bloqueios: [], paginacao: { pagina: 1, totalPaginas: 1, total: 0 } }),
    });
  });

  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: /entrar no painel/i })).toBeVisible();
  await page.getByLabel('Email').fill('admin@hsbeauty.com');
  await page.getByLabel('Senha').fill('123456');
  await page.getByRole('button', { name: /^entrar$/i }).click();

  await expect(page.getByText('Ana Lima')).toBeVisible();
});

test('admin: login invalido exibe erro de credenciais', async ({ page }) => {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ erro: 'Credenciais invalidas' }),
    });
  });

  await page.goto('/admin');

  await page.getByLabel('Email').fill('admin@hsbeauty.com');
  await page.getByLabel('Senha').fill('senha-errada');
  await page.getByRole('button', { name: /^entrar$/i }).click();

  await expect(page.getByText(/credenciais invalidas/i)).toBeVisible();
});
