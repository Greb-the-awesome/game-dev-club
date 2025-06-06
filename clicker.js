const images = [
	'./clicker-assets/duke.png',
	'./clicker-assets/harvard.svg',
	'./clicker-assets/mit.png',
	'./clicker-assets/stanford.jfif',
	'./clicker-assets/waterloo.png',
	'./clicker-assets/wharton.jfif',
	'./clicker-assets/princeton.png'
];

const button = document.getElementById('clicker-button');

button.addEventListener('click', () => {
	const randomImage = images[Math.floor(Math.random() * images.length)];
	button.style.backgroundImage = `url('${randomImage}')`;
});

let ecs = 0;
let orzosity = 1;
let aura = 0;
let costMultiplier = 1;
let rewardsMultiplier = 1;
let prestigeThreshold = 1000;

const statsEl = document.getElementById('stats');
const clickButton = document.getElementById('clicker-button');
const prestigeButton = document.getElementById('prestige-button');

prestigeButton.disabled = true;

// Upgrade definitions
const upgrades = {
	crimson: {
		name: "Crimson Education",
		level: 0,
		levels: [
			{ label: "None", orzosity: 0, aura: 0, cost: 0 },
			{ label: "Basic", orzosity: 3, aura: 0, cost: 50 },
			{ label: "Regular", orzosity: 5, aura: 0, cost: 150 },
			{ label: "Sweat", orzosity: 10, aura: 0, cost: 500 },
			{ label: "Nolife", orzosity: 25, aura: 0, cost: 1500 }
		]
	},
	deca: {
		name: "DECA",
		level: 0,
		levels: [
			{ label: "None", orzosity: 0, aura: 0, cost: 0 },
			{ label: "Bum", orzosity: 2, aura: 0, cost: 40 },
			{ label: "Provs Qual", orzosity: 4, aura: 0, cost: 120 },
			{ label: "ICDC Qual", orzosity: 8, aura: 0, cost: 400 },
			{ label: "ICDC Eorzosity", orzosity: 20, aura: 0, cost: 2400 }
		]
	},
	glazebait: {
		name: "Glazebait",
		level: 0,
		levels: [
			{ label: "Well-balanced glebber", orzosity: 0, aura: 1, cost: 0 },
			{ label: "Small glebber", orzosity: 2, aura: 3, cost: 100 },
			{ label: "Golden glazebaiter", orzosity: 4, aura: 10, cost: 1000 },
			{ label: "Wow very bait", orzosity: 8, aura: 20, cost: 10000 },
			{ label: "USAMO HM DOESNT MATTER!1!11!!", orzosity: 20, aura: 50, cost: 1000000 }
		]
	}
};

function updateStats() {
	statsEl.innerHTML = `
    <h3>Stats</h3>
    <p><strong>ECs:</strong> ${ecs.toFixed(1)}</p>
    <p><strong>Orzosity:</strong> ${orzosity}</p>
    <p><strong>Aura:</strong> ${aura}</p>
  `;

	// Update upgrade button enabled/disabled state
	for (const key in upgradeButtons) {
		const { button, cost } = upgradeButtons[key];
		button.disabled = ecs < cost * costMultiplier;
	}

	if (ecs < prestigeThreshold) {
		prestigeButton.innerHTML = "Admit<br><p style='font-size: 1rem;'>Need " + prestigeThreshold + " ECs to admit</p>";
		prestigeButton.disabled = true;
	} else {
		prestigeButton.innerHTML = "Admit";
		prestigeButton.disabled = false;
	}
}

function applyUpgrades() {
	// Recalculate orzosity and aura
	orzosity = 1;
	aura = 0;

	for (const key in upgrades) {
		const u = upgrades[key];
		const levelData = u.levels[u.level];
		orzosity += levelData.orzosity * rewardsMultiplier;
		aura += levelData.aura * rewardsMultiplier;
	}
}

const upgradeButtons = {};

function createUpgradeMenu() {
	const upgradesEl = document.getElementById('upgrades');
	upgradesEl.innerHTML = `<h3>Upgrades</h3>`;

	for (const key in upgrades) {
		const u = upgrades[key];
		const currentLevel = u.level;
		const nextLevel = u.level + 1;
		const levelInfo = u.levels[currentLevel];
		const nextInfo = u.levels[nextLevel];

		const btn = document.createElement('button');
		btn.style.marginTop = '10px';
		btn.style.width = '100%';
		btn.style.padding = '5px';
		btn.style.borderRadius = '5px';
		btn.style.fontSize = '1.5rem';

		if (nextInfo) {
			btn.textContent = `${u.name}: ${levelInfo.label} → ${nextInfo.label} (${nextInfo.cost * costMultiplier} EC)`;

			btn.onclick = () => {
				if (ecs >= nextInfo.cost * costMultiplier) {
					ecs -= nextInfo.cost * costMultiplier;
					u.level++;
					applyUpgrades();
					createUpgradeMenu();
					updateStats();
				}
			};

			upgradeButtons[key] = { button: btn, cost: nextInfo.cost * costMultiplier };
		} else {
			btn.textContent = `${u.name}: ${levelInfo.label} (MAX)`;
			btn.disabled = true;
		}

		upgradesEl.appendChild(btn);
	}
}

// Clicking the button gives ECs
clickButton.addEventListener('click', () => {
	ecs += orzosity;
	updateStats();
});

// Passive EC generation every second

setInterval(() => {
  ecs += aura;
  updateStats();
}, 1000);

// Initial setup
applyUpgrades();
createUpgradeMenu();
updateStats();

prestigeButton.onclick = function() {
	costMultiplier *= 2;
	prestigeThreshold *= 2.4;
	rewardsMultiplier *= 1.6;
	rewardsMultiplier = Math.round(rewardsMultiplier);
	prestigeThreshold = Math.ceil(prestigeThreshold);
	orzosity = 1;
	aura = 1;
	ecs = 0;
	for (const prop in upgrades) {
		upgrades[prop].level = 0;
	}
	createUpgradeMenu();
	updateStats();
}

document.getElementById('howto-button').addEventListener('click', () => {
    document.getElementById('howto-popup').classList.remove('hidden');
});

document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('howto-popup').classList.add('hidden');
});

// Optional: close popup when clicking outside content
document.getElementById('howto-popup').addEventListener('click', (e) => {
    if (e.target.id === 'howto-popup') {
        document.getElementById('howto-popup').classList.add('hidden');
    }
});
