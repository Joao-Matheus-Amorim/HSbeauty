import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarServicos, listarCombos, listarCategorias, getSiteConfig } from './services/agendamentos'
import { WHATSAPP, SERVICOS_PADRAO, CATEGORIAS_PADRAO } from './constants'
import CategoryCarousel from './components/CategoryCarousel'

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
	// Mostra todas as categorias ativas, mesmo sem servicos cadastrados —
	// a pagina de categoria exibe um estado vazio editorial nesses casos.
	return Array.from(grupos.values())
		.sort((a, b) => (a.ordem - b.ordem) || a.nome.localeCompare(b.nome, 'pt-BR'))
}

function App() {
	const navigate = useNavigate()
	const [services, setServices] = useState(fallbackServices)
	const [categoriasApi, setCategoriasApi] = useState(CATEGORIAS_PADRAO)
	const [combos, setCombos] = useState([])
	const [siteConfig, setSiteConfig] = useState({ bannerUrl: null, logoUrl: null })
	const [modalAberto, setModalAberto] = useState(false)
	const [servicoModal, setServicoModal] = useState(null)
	const [categoriaModal, setCategoriaModal] = useState(null)

	useEffect(() => {
		let mounted = true

		Promise.allSettled([
			listarServicos({ ativo: true }),
			listarCategorias(),
			listarCombos(),
			getSiteConfig(),
		]).then(([servResult, catResult, comboResult, configResult]) => {
			if (!mounted) return

			// Sucesso (mesmo array vazio) substitui o fallback —
			// nao queremos mostrar categorias fantasmas que nao existem no DB.
			if (servResult.status === 'fulfilled' && Array.isArray(servResult.value)) {
				setServices(servResult.value)
			} else if (servResult.status === 'rejected') {
				setServices(fallbackServices)
			}

			if (catResult.status === 'fulfilled' && Array.isArray(catResult.value)) {
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

	function abrirCategoria(categoria) {
		if (!categoria?.id) return
		navigate(`/c/${categoria.id}`)
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

			<section className="phone-frame" aria-label="Landing page HSBeauty">
				{siteConfig.bannerUrl ? (
					<section className="banner-hero" aria-label="HS Beauty Studio">
						<img src={siteConfig.bannerUrl} alt="HS Beauty" className="banner-hero-img" />
					</section>
				) : (
					<section className="editorial-hero" aria-label="HS Beauty Studio">
						<span className="editorial-hero-word" aria-hidden="true">beleza</span>
						<span className="editorial-hero-volume" aria-hidden="true">Vol. I · 2026</span>
						<div className="editorial-hero-image" aria-hidden="true">
							<img
								src="/hero-maiara.svg"
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
							<span className="editorial-hero-rule" aria-hidden="true" />
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
						<span className="editorial-hero-bee bee-1" aria-hidden="true" />
						<span className="editorial-hero-bee bee-2" aria-hidden="true" />
						<span className="editorial-hero-bee bee-3" aria-hidden="true" />
						<span className="editorial-hero-honey honey-1" aria-hidden="true" />
						<span className="editorial-hero-honey honey-2" aria-hidden="true" />
					</section>
				)}


				<section className="editorial-services" id="services">
					<header className="editorial-section-head">
						<span className="editorial-section-eyebrow">Catálogo</span>
						<h3 className="editorial-section-title">Escolha o cuidado.</h3>
					</header>
					{categorias.length > 0 ? (
						<CategoryCarousel
							categorias={categorias}
							onSelect={abrirCategoria}
						/>
					) : (
						<p className="editorial-empty-catalog">
							O catálogo está sendo preparado. Volte em instantes ou fale com a gente no WhatsApp.
						</p>
					)}
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

				<section className="editorial-gallery" aria-label="Galeria de trabalhos">
					<header className="editorial-section-head">
						<span className="editorial-section-eyebrow">Trabalhos recentes</span>
						<h3 className="editorial-section-title">Cada cuidado, um detalhe.</h3>
					</header>
					<div className="editorial-bento">
						<figure className="editorial-bento-tile is-tall">
							<img src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=85&auto=format&fit=crop" alt="" loading="lazy" />
							<figcaption>Unhas</figcaption>
						</figure>
						<figure className="editorial-bento-tile">
							<img src="https://images.unsplash.com/photo-1583241800698-9c2e8e0d4d6f?w=600&q=85&auto=format&fit=crop" alt="" loading="lazy" />
							<figcaption>Cílios</figcaption>
						</figure>
						<figure className="editorial-bento-tile">
							<img src="https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&q=85&auto=format&fit=crop" alt="" loading="lazy" />
							<figcaption>Sobrancelhas</figcaption>
						</figure>
						<figure className="editorial-bento-tile is-wide">
							<img src="https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=1200&q=85&auto=format&fit=crop" alt="" loading="lazy" />
							<figcaption>Spa labial</figcaption>
						</figure>
					</div>
				</section>

				<section className="editorial-final-cta">
					<div className="editorial-final-cta-inner">
						<span className="editorial-section-eyebrow editorial-eyebrow-light">Comece quando quiser</span>
						<h3 className="editorial-final-title"><em>Reserve</em> seu cuidado.</h3>
						<p className="editorial-final-sub">Em um minuto. Sem fila, sem ligação, sem complicação.</p>
						<button type="button" className="editorial-final-button" onClick={irParaServicos}>
							Marcar horário
						</button>
						<a className="editorial-final-help" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
							ou fale com a gente no WhatsApp
						</a>
					</div>
				</section>

				<footer className="editorial-footer">
					<div className="editorial-footer-mark">
						{siteConfig.logoUrl
							? <img src={siteConfig.logoUrl} alt="HS Beauty" />
							: <span>HS Beauty</span>}
					</div>
					<p className="editorial-footer-place">Studio · Piabetá, Magé — RJ</p>
					<p className="editorial-footer-credit">Feito com carinho.</p>
				</footer>
			</section>
		</main>
	)
}

export default App
