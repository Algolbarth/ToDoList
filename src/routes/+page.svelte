<script lang="ts">
	import { onMount } from 'svelte';

	let username: string = '';
	let password: string = '';
	let taskTitle: string = '';
	let token: string | null = null;
	let users: { id: number; username: string; password: string }[] = [];
	let tasks: { id: number; title: string; completed: boolean }[] = [];

	const register = async () => {
		const res = await fetch('http://localhost:3000/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});

		if (res.ok) {
			username = '';
			password = '';
			await load_user_list();
		}
	};

	const login = async () => {
		const res = await fetch('http://localhost:3000/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});

		const data = await res.json();
		if (data.token) {
			token = data.token;
			username = '';
			password = '';
			await load_task();
		}
	};

	const logout = () => {
		token = null;
		tasks = [];
	};

	const load_user_list = async () => {
		const res = await fetch('http://localhost:3000/users', {});
		users = await res.json();
	};

	const load_task = async () => {
		if (!token) return;
		const res = await fetch('http://localhost:3000/tasks', {
			headers: { Authorization: token }
		});
		tasks = await res.json();
	};

	const add_task = async () => {
		if (taskTitle.length > 0) {
			if (!token) return;
			await fetch('http://localhost:3000/tasks', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: token
				},
				body: JSON.stringify({ title: taskTitle })
			});
			await load_task();
			taskTitle = '';
		}
	};

	const delete_task = async (id: number) => {
		if (!token) return;
		await fetch(`http://localhost:3000/tasks/${id}`, {
			method: 'DELETE',
			headers: { Authorization: token }
		});
		await load_task();
	};

	onMount(() => {
		load_task();
		load_user_list();
	});
</script>

{#if token == null}
	<input type="text" bind:value={username} placeholder="Nom d'utilisateur" />
	<input type="password" bind:value={password} placeholder="Mot de passe" />
	<button on:click={register}>S'inscrire</button>
	<button on:click={login}>Se connecter</button>

	<h2>Liste des utilisateurs</h2>
	<ul>
		{#each users as user}
			<li>
				{user.username}: {user.password}
			</li>
		{/each}
	</ul>
{:else}
	<button on:click={logout}>Se déconnecter</button>

	<h2>Ajouter une tâche</h2>
	<input type="text" bind:value={taskTitle} placeholder="Nouvelle tâche" />
	<button on:click={add_task}>Ajouter</button>

	<h2>Liste des tâches</h2>
	<ul>
		{#each tasks as task}
			<li>
				{task.title}
				<button on:click={() => delete_task(task.id)}>Supprimer</button>
			</li>
		{/each}
	</ul>
{/if}
