import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { listarServicos, listarCombos, listarCategorias, getSiteConfig } from './services/agendamentos'
import { WHATSAPP, SERVICOS_PADRAO, CATEGORIAS_PADRAO } from './constants'
import CategoryCarousel from './components/CategoryCarousel'
import CategoryDrawer from './components/CategoryDrawer'

const AgendamentoModal = lazy(() => import('./components/AgendamentoModal'))

const fallbackServices = SERVICOS_PADRAO

function buildCategorias(servicos, categorias) {
	const grupos = new Map()
	categorias.forEach((c) => {
		grupos.set(c.id, {
			id: c.id,
			nome: c.nome,
			imagemUrl: c.imagemUrl || null,
			ordem: c.ordem ?? 0,
			servicos: [],
		})
	})
	servicos.forEach((s) => {
		const cat = s.categoria
		if (!cat) return
		if (!grupos.has(cat.id)) {
			grupos.set(cat.id, {
				id: cat.id,
				nome: cat.nome,
				imagemUrl: cat.imagemUrl || null,
				ordem: cat.ordem ?? 0,
				servicos: [],
			})
		}
		grupos.get(cat.id).servicos.push(s)
	})
	return Array.from(grupos.values())
		.filter((g) => g.servicos.length > 0)
		.sort((a, b) => (a.ordem - b.ordem) || a.nome.localeCompare(b.nome, 'pt-BR'))
}

function App() {
	const [services, setServices] = useState(fallbackServices)
	const [categoriasApi, setCategoriasApi] = useState(CATEGORIAS_PADRAO)
	const [combos, setCombos] = useState([])
	const [siteConfig, setSiteConfig] = useState({ bannerUrl: null, logoUrl: null })
	const [modalAberto, setModalAberto] = useState(false)
	const [servicoModal, setServicoModal] = useState(null)
	const [categoriaAberta, setCategoriaAberta] = useState(null)

	useEffect(() => {
		let mounted = true
		async function loadServices() {
			try {
				const apiServices = await listarServicos({ ativo: true })
				if (mounted && Array.isArray(apiServices) && apiServices.length) {
					setServices(apiServices)
				}
			} catch {
				if (mounted) setServices(fallbackServices)
			}
		}
		loadServices()
		listarCategorias().then((lista) => {
			if (mounted && Array.isArray(lista) && lista.length) setCategoriasApi(lista)
		}).catch(() => {})
		listarCombos().then((lista) => { if (mounted && Array.isArray(lista)) setCombos(lista.filter((c) => c.ativo)) }).catch(() => {})
		getSiteConfig().then((config) => { if (mounted && config) setSiteConfig(config) }).catch(() => {})
		return () => { mounted = false }
	}, [])

	const categorias = useMemo(() => buildCategorias(services, categoriasApi), [services, categoriasApi])

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

	function handleSelecionarServicoDaCategoria(servico) {
		setCategoriaAberta(null)
		abrirModal(servico)
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

			{categoriaAberta && (
				<CategoryDrawer
					categoria={categoriaAberta}
					onClose={() => setCategoriaAberta(null)}
					onSelectServico={handleSelecionarServicoDaCategoria}
				/>
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
					{siteConfig.bannerUrl ? (
						<div className="hero-banner-art" aria-hidden="true">
							<img src={siteConfig.bannerUrl} alt="HSBeauty" className="hero-banner-img" />
						</div>
					) : (
						<div className="hero-banner-art hero-banner-placeholder" aria-hidden="true">
							<span>HSBeauty</span>
						</div>
					)}
				</section>

				<div className="hero-dots" aria-hidden="true">
					<span className="dot active" />
					<span className="dot" />
				</div>

				<section className="meta-row glass-panel">
					<span>5.0 (150+)</span>
					<span>Piabeta / Mage</span>
					<button type="button" className="meta-row-cta" onClick={(event) => reservar(null, event)}>
						Agendar agora
					</button>
				</section>

				<section className="services-section" id="services">
					<h3>Nossos Serviços</h3>
					<p className="services-caption">
						Deslize as categorias e toque para ver os serviços.
					</p>
					<CategoryCarousel
						categorias={categorias}
						onSelect={(cat) => setCategoriaAberta(cat)}
					/>
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
						<button className="cta-button cta-primary" type="button" onClick={(event) => reservar(null, event)}>
							<span>Agendar agora</span>
							<small>Escolha serviço, dia e horário em 1 minuto</small>
						</button>
						<a className="cta-help" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
							Tem alguma dúvida? Fala com a gente no WhatsApp
						</a>
					</div>
				</section>

				<footer className="bottom-note">
					<div className="bottom-note-avatar" aria-hidden="true">
						{siteConfig.logoUrl ? <img src={siteConfig.logoUrl} alt="HSBeauty" /> : 'HS'}
					</div>
					<p>HSBeauty Studio - atendimento para clientes</p>
				</footer>
			</section>
		</main>
	)
}

export default App
