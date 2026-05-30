import { test, expect } from '@playwright/test';

const CAT_UNHAS = { id: 1, nome: 'Unhas', imagemUrl: null, ordem: 0 };
const CAT_CILIOS = { id: 2, nome: 'Cilios', imagemUrl: null, ordem: 1 };
const CAT_SOBR = { id: 3, nome: 'Sobrancelhas', imagemUrl: null, ordem: 2 };
const CAT_DEPIL = { id: 4, nome: 'Depilacao', imagemUrl: null, ordem: 3 };

const SERVICOS = [
  { id: 1, nome: 'Unhas', duracao: 60, preco: 60, ativo: true, categoria: CAT_UNHAS, categoriaId: 1 },
  { id: 2, nome: 'Cilios', duracao: 30, preco: 50, ativo: true, categoria: CAT_CILIOS, categoriaId: 2 },
  { id: 3, nome: 'Sobrancelhas', duracao: 40, preco: 45, ativo: true, categoria: CAT_SOBR, categoriaId: 3 },
  { id: 4, nome: 'Depilacao', duracao: 20, preco: 35, ativo: true, categoria: CAT_DEPIL, categoriaId: 4 },
];

async function mockPublicAPIs(page) {
  await page.route('**/servicos*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SERVICOS) });
  });
  await page.route('**/categorias', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CAT_UNHAS, CAT_CILIOS, CAT_SOBR, CAT_DEPIL]) });
  });
  await page.route('**/combos', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/config', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ bannerUrl: null, logoUrl: null }) });
  });
  await page.route('**/disponibilidade*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ slotsDisponiveis: [{ inicio: '2026-05-27T09:00:00.000Z', horario: '09:00' }] }),
    });
  });
}

test('publico: conclui fluxo minimo de agendamento', async ({ page }) => {
  await mockPublicAPIs(page);

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
        servico: SERVICOS[0],
      }),
    });
  });

  await page.goto('/');

  // Carrossel -> categoria Unhas -> drawer -> sub-servico
  await page.locator('.cat-card').first().click();
  await page.locator('.cat-drawer-item').first().click();
  // Modal abre ja com servico pre-selecionado
  await page.locator('.week-day-btn').first().click();
  await page.getByRole('button', { name: '09:00' }).click();
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.getByPlaceholder('Maria da Silva').fill('Maria');
  await page.getByPlaceholder('(21) 99999-9999').fill('(21) 99999-8888');
  await page.getByRole('button', { name: /confirmar agendamento/i }).click();

  await expect(page.getByText('Agendamento confirmado!')).toBeVisible();
  await expect(page.getByRole('link', { name: /confirmar pelo whatsapp/i })).toBeVisible();
});

test('publico: horario indisponivel exibe erro', async ({ page }) => {
  await mockPublicAPIs(page);

  await page.route('**/agendamentos', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ erro: 'Horario indisponivel' }),
    });
  });

  await page.goto('/');

  await page.locator('.cat-card').first().click();
  await page.locator('.cat-drawer-item').first().click();
  await page.locator('.week-day-btn').first().click();
  await page.getByRole('button', { name: '09:00' }).click();
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.getByPlaceholder('Maria da Silva').fill('Maria');
  await page.getByPlaceholder('(21) 99999-9999').fill('(21) 99999-8888');
  await page.getByRole('button', { name: /confirmar agendamento/i }).click();

  await expect(page.getByText(/horario indisponivel/i)).toBeVisible();
});
