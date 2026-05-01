import { useEffect, useMemo, useState } from 'react'
import heroBanner from '../Saved Pictures/principalmai.png'
import ownerProfile from '../Saved Pictures/maiara2.png'
import ownerSecondary from '../Saved Pictures/maiara1.png'
import unhasImage from '../Saved Pictures/unha1.png'
import ciliosImage from '../Saved Pictures/sobranchelha2.png'
import depilacaoImage from '../Saved Pictures/depil1.png'
import { listarServicos } from './services/agendamentos'
import AgendamentoModal from './components/AgendamentoModal'

const WHATSAPP = import.meta.env.VITE_WHATSAPP || '5521970976928'

const fallbackServices = [
	{ id: 1, nome: 'Unhas', preco: 35, duracao: 60, ativo: true },
	{ id: 2, nome: 'Cílios', preco: 140, duracao: 90, ativo: true },
	{ id: 3, nome: 'Sobrancelhas', preco: 70, duracao: 45, ativo: true },
	{ id: 4, nome: 'Depilação', preco: 50, duracao: 45, ativo: true },
]

const serviceNameOrder = ['unhas', 'cilios', 'sobrancelhas', 'depilacao']

const removeAccents = (value) =>
	value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const normalizeServiceName = (name) => {
	const normalized = removeAccents(name || '')
	if (normalized.includes('unha') || normalized.includes('manicure')) return 'unhas'
	if (normalized.includes('cilio')) return 'cilios'
	if (normalized.includes('sobrancelha')) return 'sobrancelhas'
	if (normalized.includes('depila')) return 'depilacao'
	return normalized
}

const getServiceImage = (name) => {
	const normalized = normalizeServiceName(name)
	if (normalized === 'unhas') return unhasImage
	if (normalized === 'cilios') return ownerSecondary
	if (normalized === 'sobrancelhas') return ciliosImage
	if (normalized === 'depilacao') return depilacaoImage
	return ownerProfile
}

function App() {
	const [services, setServices] = useState(fallbackServices)
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

	return (
		<main className="beauty-app">
			{modalAberto && (
				<AgendamentoModal
					servicoInicial={servicoModal}
					onClose={() => setModalAberto(false)}
				/>
			)}

			<section className="phone-frame" aria-label="Landing page HSBeauty">
				<section className="hero hero-art">
					<div className="topbar topbar-overlay glass-panel">
						<button className="icon-button" aria-label="Abrir menu">
							<span className="menu-icon" />
						</button>
						<button className="gold-pill" onClick={() => abrirModal()}>
							Agendar ›
						</button>
					</div>
					<img src={heroBanner} alt="HSBeauty banner principal" className="hero-banner-art" />
				</section>

				<div className="hero-dots" aria-hidden="true">
					<span className="dot active" />
					<span className="dot" />
				</div>

				<section className="meta-row glass-panel">
					<span>Avaliação 5.0 (150+)</span>
					<span>Piabeta / Mage</span>
					<a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
						Chamar no WhatsApp
					</a>
				</section>

				<section className="services-section" id="services">
					<h3>Nossos Serviços</h3>
					<p className="services-caption">
						Rituais de beleza para unhas, cílios, sobrancelhas e depilação com acabamento leve e sofisticado.
					</p>
					<div className="services-grid">
						{orderedServices.map((service) => (
							<article className="service-card" key={service.id || service.nome}>
								<img src={getServiceImage(service.nome)} alt={service.nome} loading="lazy" />
								<div className="service-card-body">
									<h4>{service.nome}</h4>
									<button className="service-action" onClick={() => abrirModal(service)}>
										Reservar horário
									</button>
								</div>
							</article>
						))}
					</div>
				</section>

				<section className="results-section glass-panel">
					<h3>Galeria de Resultados</h3>
					<p>Resultados reais com acabamento de alta definição para valorizar seu estilo.</p>
					<div className="gallery-strip">
						<img src={ownerSecondary} alt="Resultado de atendimento HSBeauty" loading="lazy" />
						<img src={ciliosImage} alt="Cílios feitos no studio" loading="lazy" />
					</div>
					<div className="cta-stack">
						<a className="cta-button cta-primary" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
							<span>Agendar no WhatsApp</span>
							<small>Atendimento rápido e direto</small>
						</a>
						<button className="cta-button cta-secondary" onClick={() => abrirModal()}>
							<span>Escolher serviço e horário</span>
							<small>Monte seu atendimento personalizado</small>
						</button>
					</div>
				</section>

				<footer className="bottom-note">
					<img src={ownerProfile} alt="Gestora HSBeauty" loading="lazy" />
					<p>HSBeauty Studio - Gestora e prestadora dos serviços</p>
				</footer>
			</section>
		</main>
	)
}

export default App
