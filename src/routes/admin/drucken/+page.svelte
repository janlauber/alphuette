<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import Megaphone from '@lucide/svelte/icons/megaphone';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
</script>

<AdminPage title="Drucken" intro="Ein Infoblatt für die Gäste im Hüttli und ein Flyer zum Aufhängen am Weg. Beide holen die Texte von der Website.">
	{#snippet help()}
		<ul>
			<li>Wähle oben Hoch- oder Querformat und die Sprache, dann «Drucken». Im Druckfenster «A4» und «Ohne Ränder» oder «Randlos» wählen, falls es das gibt.</li>
			<li>Beim Infoblatt kannst du Teile weglassen, wenn es nicht auf eine Seite passt. Die Texte änderst du unter <a href="/admin/inhalte">Texte und Infos</a>.</li>
			<li>Die QR-Codes führen auf die Website. Wer den Flyer scannt, erscheint unter <a href="/admin/analytics">Besucher</a> mit der Quelle «flyer».</li>
		</ul>
	{/snippet}

	<div class="grid gap-5 sm:grid-cols-2">
		{#each [{ sheet: 'infoblatt', icon: FileText, title: 'Infoblatt für Gäste', text: 'Ankunft und Abreise, Gut zu wissen, Hausregeln, Notfallnummern, Läden, QR-Codes zu Wanderungen und Fahrplan.' }, { sheet: 'flyer', icon: Megaphone, title: 'Flyer zum Aufhängen', text: 'Bild vom Hüttli, das Wichtigste in drei Zeilen, Preis ab, grosser QR-Code zu freien Wochen.' }] as s (s.sheet)}
			<div class="card flex flex-col gap-3 p-5">
				<s.icon class="text-brand" size={28} aria-hidden="true" />
				<h2 class="text-xl">{s.title}</h2>
				<p class="text-muted">{s.text}</p>
				<div class="mt-auto flex flex-wrap gap-2">
					<a href="/admin/drucken/{s.sheet}" class="btn-blue no-underline">Hochformat</a>
					<a href="/admin/drucken/{s.sheet}?format=quer" class="btn-line no-underline">Querformat</a>
				</div>
			</div>
		{/each}
	</div>
</AdminPage>
