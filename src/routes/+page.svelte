<script lang="ts">
	import { onMount } from 'svelte';

	let username = '';
	let password = '';
	let taskTitle = '';
	let token: string | null = null;
	let tasks: { id: number; title: string; completed: boolean }[] = [];

	const register = async () => {
		await fetch('http://localhost:3000/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		username = '';
		password = '';
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
			await loadTasks();
		}
	};

	const logout = () => {
		token = null;
		tasks = [];
	};

	const loadTasks = async () => {
		if (!token) return;
		const res = await fetch('http://localhost:3000/tasks', {
			headers: { Authorization: token }
		});
		tasks = await res.json();
	};

	const addTask = async () => {
		if (taskTitle.length > 0) {
			if (!token) return;
			const res = await fetch('http://localhost:3000/tasks', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: token
				},
				body: JSON.stringify({ title: taskTitle })
			});
			const newTask = await res.json();
			tasks = [...tasks, newTask];
			taskTitle = '';
		}
	};

	onMount(loadTasks);
</script>

{#if token == null}
	<input type="text" bind:value={username} placeholder="Nom d'utilisateur" />
	<input type="password" bind:value={password} placeholder="Mot de passe" />
	<button on:click={register}>S'inscrire</button>
	<button on:click={login}>Se connecter</button>
{:else}
	<button on:click={logout}>Se déconnecter</button>

	<h2>Ajouter une tâche</h2>
	<input type="text" bind:value={taskTitle} placeholder="Nouvelle tâche" />
	<button on:click={addTask}>Ajouter</button>

	<h2>Liste des tâches</h2>
	<ul>
		{#each tasks as task}
			<li>{task.title}</li>
		{/each}
	</ul>
{/if}
