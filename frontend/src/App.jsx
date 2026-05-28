import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { listarServicos, listarCombos } from './services/agendamentos'
import { WHATSAPP, SERVICOS_PADRAO } from './constants'

const AgendamentoModal = lazy(() => import('./components/AgendamentoModal'))

const fallbackServices = SERVICOS_PADRAO

const serviceNameOrder = ['unhas', 'cilios', 'sobrancelhas', 'depilacao']

const removeAccents = (value) =>
	String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const normalizeServiceName = (name) => {
	const normalized = removeAccents(name || '')
	if (normalized.includes('unha') || normalized.includes('manicure')) return 'unhas'
	if (normalized.includes('cilio')) return 'cilios'
	if (normalized.includes('sobrancelha')) return 'sobrancelhas'
	if (normalized.includes('depila')) return 'depilacao'
	return normalized
}

const serviceVisualLabel = (name) => {
	const normalized = normalizeServiceName(name)
	if (normalized === 'unhas') return 'UN'
	if (normalized === 'cilios') return 'CL'
	if (normalized === 'sobrancelhas') return 'SB'
	if (normalized === 'depilacao') return 'DP'
	return 'HS'
}

function App() {
	const [services, setServices] = useState(fallbackServices)
	const [combos, setCombos] = useState([])
	const [modalAberto, setModalAberto] = useState(false)
	const [servicoModal, setServicoModal] = useState(null)

	useEffect(() => {
		let mounted = true
		async function loadServices() {
			try {
				const apiServices = await listarServicos({ ativo: true })
				if (!Array.isArray(apiServices) || !apiServices.length) return
				const wantedServices = apiServices
					.filter((item) => serviceNameOrder.includes(normalizeServiceName(item.nome)))
					.sort((a, b) => serviceNameOrder.indexOf(normalizeServiceName(a.nome)) - serviceNameOrder.indexOf(normalizeServiceName(b.nome)))
				const fallbackByType = new Map(fallbackServices.map((item) => [normalizeServiceName(item.nome), item]))
				const apiByType = new Map(wantedServices.map((item) => [normalizeServiceName(item.nome), item]))
				const mergedServices = serviceNameOrder.map((type) => apiByType.get(type) || fallbackByType.get(type)).filter(Boolean)
				if (mounted && mergedServices.length) setServices(mergedServices)
			} catch {
				if (mounted) setServices(fallbackServices)
			}
		}
		loadServices()
		listarCombos().then((lista) => { if (mounted && Array.isArray(lista)) setCombos(lista.filter((c) => c.ativo)) }).catch(() => {})
		return () => { mounted = false }
	}, [])

	const orderedServices = useMemo(
		() => services
			.filter((item) => serviceNameOrder.includes(normalizeServiceName(item.nome)))
			.sort((a, b) => serviceNameOrder.indexOf(normalizeServiceName(a.nome)) - serviceNameOrder.indexOf(normalizeServiceName(b.nome))),
		[services]
	)

	function abrirModal(servico = null) {
		setServicoModal(servico)
		setModalAberto(true)
	}

	function reservar(servico = null, event) {
		if (event) {
			event.preventDefault()
			event.stopPropagation()
		}
		abrirModal(servico)
	}

	function handleCardKeyDown(event, service) {
		if (event.key === 'Enter' || event.key === ' ') {
			reservar(service, event)
		}
	}

	return (
		<main className="beauty-app">
			{modalAberto && (
				<Suspense fallback={null}>
					<AgendamentoModal
						servicoInicial={servicoModal}
						onClose={() => setModalAberto(false)}
					/>
				</Suspense>
			)}

			<section className="phone-frame" aria-label="Landing page HSBeauty">
				<section className="hero hero-art">
					<div className="topbar topbar-overlay glass-panel">
						<button className="icon-button" aria-label="Abrir menu" type="button">
							<span className="menu-icon" />
						</button>
						<button className="gold-pill" type="button" onClick={(event) => reservar(null, event)}>
							Agendar ›
						</button>
					</div>
					<div className="hero-banner-art hero-banner-placeholder" aria-hidden="true">
						<span>HSBeauty</span>
					</div>
				</section>

				<div className="hero-dots" aria-hidden="true">
					<span className="dot active" />
					<span className="dot" />
				</div>

				<section className="meta-row glass-panel">
					<span>5.0 (150+)</span>
					<span>Piabeta / Mage</span>
					<a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
						Chamar no WhatsApp
					</a>
				</section>

				<section className="services-section" id="services">
					<h3>Nossos Serviços</h3>
					<p className="services-caption">
						Escolha um serviço abaixo para reservar.
					</p>
					<div className="services-grid">
						{orderedServices.map((service) => (
							<article
								className="service-card service-card-button"
								key={service.id || service.nome}
								onClick={(event) => reservar(service, event)}
								onKeyDown={(event) => handleCardKeyDown(event, service)}
								role="button"
								tabIndex={0}
								aria-label={`Reservar ${service.nome}`}
							>
								<div className="service-card-media" aria-hidden="true">
									{service.imagemUrl ? (
										<img src={service.imagemUrl} alt={service.nome} loading="lazy" />
									) : (
										<span>{serviceVisualLabel(service.nome)}</span>
									)}
								</div>
								<div className="service-card-body">
									<h4>{service.nome}</h4>
									<button
										type="button"
										className="service-action"
										onClick={(event) => reservar(service, event)}
									>
										Reservar
									</button>
								</div>
							</article>
						))}
					</div>
				</section>

				{combos.length > 0 && (
					<section className="services-section" id="combos">
						<h3>Combos</h3>
						<p className="services-caption">Pacotes com serviços combinados.</p>
						<div className="services-grid">
							{combos.map((combo) => {
								const duracaoTotal = combo.itens?.reduce((s, i) => s + i.servico.duracao, 0) || 0
								const horas = Math.floor(duracaoTotal / 60)
								const mins = duracaoTotal % 60
								const duracaoLabel = horas > 0 ? `${horas}h${mins > 0 ? `${mins}min` : ''}` : `${mins}min`
								return (
									<article
										className="service-card service-card-button"
										key={combo.id}
										onClick={(event) => reservar(null, event)}
										onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') reservar(null, event) }}
										role="button"
										tabIndex={0}
										aria-label={`Reservar ${combo.nome}`}
									>
										<div className="service-card-media" aria-hidden="true">
											<span>CB</span>
										</div>
										<div className="service-card-body">
											<h4>{combo.nome}</h4>
											<p style={{ fontSize: '0.78rem', color: '#9a7060', margin: '2px 0 4px' }}>
												{`R$ ${Number(combo.preco).toFixed(2).replace('.', ',')} · ${duracaoLabel}`}
											</p>
											<button type="button" className="service-action" onClick={(event) => reservar(null, event)}>
												Reservar
											</button>
										</div>
									</article>
								)
							})}
						</div>
					</section>
				)}

				<section className="results-section glass-panel">
					<h3>Galeria de Resultados</h3>
					<p>Resultados reais com acabamento de alta definição para valorizar seu estilo.</p>
					<div className="gallery-strip">
						<div className="gallery-placeholder" aria-hidden="true"><span>Resultado A</span></div>
						<div className="gallery-placeholder" aria-hidden="true"><span>Resultado B</span></div>
					</div>
					<div className="cta-stack">
						<a className="cta-button cta-primary" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
							<span>Agendar no WhatsApp</span>
							<small>Atendimento rápido e direto</small>
						</a>
						<button className="cta-button cta-secondary" type="button" onClick={(event) => reservar(null, event)}>
							<span>Reservar</span>
							<small>Escolha serviço, dia e horário</small>
						</button>
					</div>
				</section>

				<footer className="bottom-note">
					<div className="bottom-note-avatar" aria-hidden="true">HS</div>
					<p>HSBeauty Studio - atendimento para clientes</p>
				</footer>
			</section>
		</main>
	)
}

export default App
