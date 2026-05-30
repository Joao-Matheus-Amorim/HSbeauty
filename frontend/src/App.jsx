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
	const [categoriaModal, setCategoriaModal] = useState(null)
	const [categoriaAberta, setCategoriaAberta] = useState(null)

	useEffect(() => {
		let mounted = true

		Promise.allSettled([
			listarServicos({ ativo: true }),
			listarCategorias(),
			listarCombos(),
			getSiteConfig(),
		]).then(([servResult, catResult, comboResult, configResult]) => {
			if (!mounted) return

			if (servResult.status === 'fulfilled' && Array.isArray(servResult.value) && servResult.value.length) {
				setServices(servResult.value)
			} else if (servResult.status === 'rejected') {
				setServices(fallbackServices)
			}

			if (catResult.status === 'fulfilled' && Array.isArray(catResult.value) && catResult.value.length) {
				setCategoriasApi(catResult.value)
			}

			if (comboResult.status === 'fulfilled' && Array.isArray(comboResult.value)) {
				setCombos(comboResult.value.filter((c) => c.ativo))
			}

			if (configResult.status === 'fulfilled' && configResult.value) {
				setSiteConfig(configResult.value)
			}
		})

		return () => { mounted = false }
	}, [])

	const categorias = useMemo(() => buildCategorias(services, categoriasApi), [services, categoriasApi])

	function abrirModal(servico = null, categoria = null) {
		setServicoModal(servico)
		setCategoriaModal(categoria)
		setModalAberto(true)
	}

	function reservar(servico = null, event) {
		if (event) {
			event.preventDefault()
			event.stopPropagation()
		}
		abrirModal(servico, null)
	}

	function handleSelecionarServicoDaCategoria(servico) {
		const cat = categoriaAberta
		setCategoriaAberta(null)
		abrirModal(servico, cat)
	}

	function irParaServicos(event) {
		if (event) {
			event.preventDefault()
			event.stopPropagation()
		}
		const alvo = document.getElementById('services')
		if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	return (
		<main className="beauty-app">
			{modalAberto && (
				<Suspense fallback={null}>
					<AgendamentoModal
						servicoInicial={servicoModal}
						categoriaInicial={categoriaModal}
						onClose={() => { setModalAberto(false); setCategoriaModal(null); }}
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
				{siteConfig.bannerUrl ? (
					<section className="banner-hero" aria-label="HS Beauty Studio">
						<div className="banner-hero-image" aria-hidden="true">
							<img src={siteConfig.bannerUrl} alt="HS Beauty" className="banner-hero-img" />
						</div>
						<header className="banner-topbar">
							<span className="banner-mark">
								{siteConfig.logoUrl
									? <img src={siteConfig.logoUrl} alt="HS Beauty" />
									: <span className="banner-wordmark">HS Beauty</span>}
							</span>
							<button type="button" className="banner-cta" onClick={irParaServicos}>
								Marcar horário
							</button>
						</header>
					</section>
				) : (
					<section className="editorial-hero" aria-label="HS Beauty Studio">
						<div className="editorial-hero-image" aria-hidden="true">
							<img
								src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=85&auto=format&fit=crop"
								alt=""
								className="editorial-hero-img"
							/>
							<div className="editorial-hero-gradient" />
						</div>

						<header className="editorial-topbar">
							<span className="editorial-mark">
								{siteConfig.logoUrl
									? <img src={siteConfig.logoUrl} alt="HS Beauty" />
									: <span className="editorial-wordmark">HS Beauty</span>}
							</span>
							<span className="editorial-place">Piabetá · Magé</span>
						</header>

						<div className="editorial-hero-content">
							<span className="editorial-eyebrow">Studio · desde 2019</span>
							<h1 className="editorial-title">
								<em>Cuidado</em><br/>que se sente.
							</h1>
							<p className="editorial-sub">
								Unhas, cílios, sobrancelhas, depilação e spa labial — feitos com tempo, no seu tempo.
							</p>
							<div className="editorial-cta-row">
								<button type="button" className="editorial-cta" onClick={irParaServicos}>
									Marcar horário
								</button>
								<span className="editorial-rating">5,0 · 150+ clientes</span>
							</div>
						</div>
					</section>
				)}


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
						<button className="cta-button cta-primary" type="button" onClick={irParaServicos}>
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
