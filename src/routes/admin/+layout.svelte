<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { afterNavigate, refreshAll } from '$app/navigation';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import DatabaseBackup from '@lucide/svelte/icons/database-backup';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Footprints from '@lucide/svelte/icons/footprints';
	import History from '@lucide/svelte/icons/history';
	import House from '@lucide/svelte/icons/house';
	import Images from '@lucide/svelte/icons/images';
	import Inbox from '@lucide/svelte/icons/inbox';
	import Mail from '@lucide/svelte/icons/mail';
	import Menu from '@lucide/svelte/icons/menu';
	import Activity from '@lucide/svelte/icons/activity';
	import MessageSquareHeart from '@lucide/svelte/icons/message-square-heart';
	import Printer from '@lucide/svelte/icons/printer';
	import FileText from '@lucide/svelte/icons/file-text';
	import Tag from '@lucide/svelte/icons/tag';
	import Banknote from '@lucide/svelte/icons/banknote';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import BookOpenText from '@lucide/svelte/icons/book-open-text';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Users from '@lucide/svelte/icons/users';
	import X from '@lucide/svelte/icons/x';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import Huettli from '#lib/components/Huettli.svelte';
	import HelpPanel from '#lib/components/admin/HelpPanel.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';

	let { data, children } = $props();

	const groups = $derived([
		{
			label: 'Alltag',
			items: [
				{ href: '/admin', label: 'Übersicht', icon: House },
				{ href: '/admin/handbuch', label: 'Handbuch', icon: BookOpenText },
				{ href: '/admin/buchungen', label: 'Buchungen', icon: Inbox, badge: data.open + data.unread },
				{ href: '/admin/kalender', label: 'Kalender', icon: CalendarDays },
				{ href: '/admin/finanzen', label: 'Finanzen', icon: Banknote, badge: data.overdue },
				{ href: '/admin/gaeste', label: 'Gäste', icon: Users },
				{ href: '/admin/bewertungen', label: 'Gästebuch', icon: MessageSquareHeart, badge: data.reviews }
			]
		},
		{
			label: 'Website',
			items: [
				{ href: '/admin/inhalte', label: 'Texte und Infos', icon: FileText },
				{ href: '/admin/hausregeln', label: 'Hausregeln', icon: ScrollText },
				{ href: '/admin/anleitungen', label: 'Anleitungen für Gäste', icon: KeyRound },
				{ href: '/admin/preise', label: 'Preise und Saisons', icon: Tag },
				{ href: '/admin/gastgeber', label: 'Gastgeber und Zahlung', icon: Wallet },
				{ href: '/admin/fotos', label: 'Fotos', icon: Images },
				{ href: '/admin/wanderungen', label: 'Wanderungen', icon: Footprints },
				{ href: '/admin/drucken', label: 'Drucken', icon: Printer }
			]
		},
		{
			label: 'Hintergrund',
			items: [
				{ href: '/admin/analytics', label: 'Besucher', icon: ChartColumn },
				{ href: '/admin/mails', label: 'Mails', icon: Mail },
				{ href: '/admin/verlauf', label: 'Verlauf', icon: History },
				{ href: '/admin/sicherungen', label: 'Sicherungen', icon: DatabaseBackup },
				{ href: '/admin/system', label: 'System', icon: Activity, badge: data.errors }
			]
		}
	]);
	const current = (href: string) => (href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href));
	const here = $derived(groups.flatMap((g) => g.items).find((i) => current(i.href)));

	let menu = $state(false);
	let help = $state<HelpPanel>();
	afterNavigate(() => (menu = false));

	// Message after a change, with an undo button when the change can be undone.
	type Toast = { title: string; activity?: number; error?: boolean };
	let toast = $state<Toast | null>(null);
	let timer: ReturnType<typeof setTimeout>;
	function show(t: Toast | null) {
		toast = t;
		clearTimeout(timer);
		if (t) timer = setTimeout(() => (toast = null), t.activity ? 15_000 : 6_000);
	}
	$effect(() => {
		const f = page.form as { done?: Toast } | null;
		if (f?.done) show(f.done);
	});
</script>

<svelte:head>
	<title>{here ? `${here.label} · ` : ''}Verwaltung · Alphütte</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#snippet nav()}
	<nav class="grid gap-6" aria-label="Verwaltung">
		{#each groups as g (g.label)}
			<div>
				<p class="px-3 text-xs font-bold uppercase tracking-wider text-muted">{g.label}</p>
				<ul class="mt-1.5 grid gap-0.5">
					{#each g.items as item (item.href)}
						<li>
							<a
								href={item.href}
								class="flex items-center gap-3 rounded-full px-3 py-2 font-semibold no-underline transition-colors {current(item.href) ? 'bg-brand text-white' : 'text-ink hover:bg-wash'}"
								aria-current={current(item.href) ? 'page' : undefined}
							>
								<item.icon size={19} strokeWidth={2.25} aria-hidden="true" />
								<span class="flex-1">{item.label}</span>
								{#if item.badge}<span class="min-w-6 rounded-full bg-accent px-1.5 text-center text-sm font-bold text-ink" title="Neu">{item.badge}</span>{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</nav>
	<button type="button" onclick={() => ((menu = false), help?.open())} class="mt-6 flex w-full items-center gap-3 rounded-full border-2 border-brand px-3 py-2 font-semibold text-brand hover:bg-wash">
		<CircleHelp size={19} strokeWidth={2.25} aria-hidden="true" />Hilfe
	</button>
	<div class="mt-6 grid gap-3 border-t-2 border-line px-3 pt-5 text-sm">
		<a href="/" target="_blank" class="flex items-center gap-2 font-semibold text-brand">Website ansehen <ExternalLink size={15} aria-hidden="true" /></a>
		<p class="break-all text-muted">Angemeldet als {data.admin}</p>
		<form method="POST" action="/admin/logout"><button class="font-semibold text-brand underline">Abmelden</button></form>
	</div>
{/snippet}

{#if data.admin}
	<div class="min-h-dvh bg-wash/50 lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
		<!-- mobile: bar with menu button -->
		<header class="sticky top-0 z-30 flex items-center justify-between border-b-2 border-line bg-paper px-4 py-2.5 lg:hidden">
			<a href="/admin" class="flex items-center gap-2 font-bold text-brand no-underline"><Huettli mini class="size-9" />{here?.label ?? 'Verwaltung'}</a>
			<button type="button" class="btn-line !min-h-0 !px-4 !py-1.5 text-sm" onclick={() => (menu = true)} aria-expanded={menu} aria-controls="admin-menu">
				<Menu size={18} aria-hidden="true" />Menü{#if data.open + data.unread + data.reviews}<span class="ml-1 rounded-full bg-accent px-1.5 text-xs font-bold text-ink">{data.open + data.unread + data.reviews}</span>{/if}
			</button>
		</header>
		{#if menu}
			<div id="admin-menu" class="fixed inset-0 z-40 overflow-y-auto bg-paper px-4 pb-10 pt-3 lg:hidden" role="dialog" aria-modal="true" aria-label="Menü">
				<div class="mb-4 flex items-center justify-between">
					<span class="flex items-center gap-2 font-bold text-brand"><Huettli mini class="size-9" />Verwaltung</span>
					<button type="button" class="grid size-11 place-items-center rounded-full border-2 border-brand text-brand" onclick={() => (menu = false)} aria-label="Menü schliessen"><X size={20} /></button>
				</div>
				{@render nav()}
			</div>
		{/if}

		<aside class="hidden border-r-2 border-line bg-paper px-3 py-5 lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-y-auto">
			<a href="/admin" class="mb-6 flex items-center gap-2.5 px-3 text-lg font-bold text-brand no-underline">
				<Huettli mini class="size-10" />
				<span class="leading-tight">Alphütte<span class="block text-xs font-semibold text-muted">Verwaltung</span></span>
			</a>
			{@render nav()}
		</aside>

		<main class="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 sm:px-8 sm:pt-10">
			{@render children()}
		</main>
	</div>

	<HelpPanel bind:this={help} assistant={data.assistant} />
	<ConfirmDialog />

	{#if toast}
		<div class="fixed inset-x-3 bottom-4 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-[18px] border-2 border-brand bg-paper px-4 py-3 shadow-[0_5px_0_var(--color-brand)] sm:bottom-6" role="status">
			<p class="flex-1 font-semibold {toast.error ? 'text-danger' : 'text-ink'}">{toast.title}</p>
			{#if toast.activity}
				<form
					method="POST"
					action="/admin/verlauf?/undo"
					use:enhance={() =>
						async ({ result }) => {
							// stay on this page, just reload its data
							if (result.type === 'failure') show({ title: String(result.data?.error ?? 'Das ging nicht.'), error: true });
							else show({ title: 'Rückgängig gemacht' });
							await refreshAll();
						}}
				>
					<input type="hidden" name="id" value={toast.activity} />
					<button class="btn-line !min-h-0 !px-4 !py-1.5 text-sm">Rückgängig</button>
				</form>
			{/if}
			<button type="button" class="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-wash" onclick={() => show(null)} aria-label="Meldung schliessen"><X size={18} /></button>
		</div>
	{/if}
{:else}
	{@render children()}
{/if}
