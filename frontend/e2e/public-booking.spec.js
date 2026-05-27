import { test, expect } from '@playwright/test';

test('publico: conclui fluxo minimo de agendamento', async ({ page }) => {
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

  await page.route('**/disponibilidade*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        slotsDisponiveis: [{ inicio: '2026-05-27T09:00:00.000Z', horario: '09:00' }],
      }),
    });
  });

  await page.route('**/agendamentos', async (route) => {
    const payload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 10,
        nomeCliente: payload.nomeCliente,
        telefone: payload.telefone,
        data: payload.data,
        status: 'pendente',
        servico: { id: 1, nome: 'Unhas', duracao: 60, preco: 60 },
      }),
    });
  });

  await page.goto('/');

  await page.getByRole('button', { name: /agendar/i }).click();
  await page.locator('.service-choice-btn').first().click();
  await page.locator('.week-day-btn').first().click();
  await page.locator('.modal-step .modal-btn.primary').click();
  await page.getByRole('button', { name: '09:00' }).click();
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.getByPlaceholder('Maria da Silva').fill('Maria');
  await page.getByPlaceholder('(21) 99999-9999').fill('(21) 99999-8888');
  await page.getByRole('button', { name: /confirmar agendamento/i }).click();

  await expect(page.getByText('Agendamento confirmado!')).toBeVisible();
  await expect(page.getByRole('link', { name: /confirmar pelo whatsapp/i })).toBeVisible();
});

test('publico: horario indisponivel exibe erro', async ({ page }) => {
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

  await page.route('**/disponibilidade*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        slotsDisponiveis: [{ inicio: '2026-05-27T09:00:00.000Z', horario: '09:00' }],
      }),
    });
  });

  await page.route('**/agendamentos', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ erro: 'Horario indisponivel' }),
    });
  });

  await page.goto('/');

  await page.getByRole('button', { name: /agendar/i }).click();
  await page.locator('.service-choice-btn').first().click();
  await page.locator('.week-day-btn').first().click();
  await page.locator('.modal-step .modal-btn.primary').click();
  await page.getByRole('button', { name: '09:00' }).click();
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.getByPlaceholder('Maria da Silva').fill('Maria');
  await page.getByPlaceholder('(21) 99999-9999').fill('(21) 99999-8888');
  await page.getByRole('button', { name: /confirmar agendamento/i }).click();

  await expect(page.getByText(/horario indisponivel/i)).toBeVisible();
});
