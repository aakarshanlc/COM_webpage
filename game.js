const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        const audioEls = {
            x2011: document.getElementById('x2011Music'),
            tripwire: document.getElementById('tripwireMusic'),
            lms: document.getElementById('lmsMusic'),
            lmsSonic: document.getElementById('lmsSonic'),
            lmsTails: document.getElementById('lmsTails'),
            lmsKnuckles: document.getElementById('lmsKnuckles'),
            lmsBlaze: document.getElementById('lmsBlaze'),
            lmsCream: document.getElementById('lmsCream'),
            oneBounce: document.getElementById('oneBounceMusic'),
            doe: document.getElementById('doeMusic'),
            menu: document.getElementById('menuMusic'),
            charlieLms: document.getElementById('charlieLmsMusic'),
            starved: document.getElementById('starvedMusic')
        };
        
        const WIDTH = 1250;
        const HEIGHT = 650;
        
        const MENU = 0;
        const GAME_SETUP = 1;
        const PLAYING = 2;
        const GAME_OVER = 3;
        const SETTINGS = 4;
        const ABOUT_ABILITIES = 5;
        const ABOUT_CREDITS = 6;
        const PAUSED = 7;
        
        let showHitboxes = true; 
        let showHurtboxes = true;
        let devMode = false; 
        
        // Audio Volume Control
        let globalMusicVolume = 0.8; // Fixed from 1.5 (HTML5 max is 1.0)
        let isDraggingVolume = false;

        let controlSchemes = {
            p1: { up: 'w', down: 's', left: 'a', right: 'd', ability1: 'q', ability2: 'e', ability3: 'r', m1: ' ' },
            p2: { up: 't', down: 'g', left: 'f', right: 'h', ability1: 'z', ability2: 'x', ability3: 'c', m1: 'v' },
            p3: { up: 'i', down: 'k', left: 'j', right: 'l', ability1: 'u', ability2: 'o', ability3: 'p', m1: 'm' },
            p4: { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', ability1: '[', ability2: ']', ability3: '\\', m1: 'enter' } // Fixed 'Enter' -> 'enter'
        }

        function loadStorage() {
            try {
                const savedControls = localStorage.getItem('om_controls');
                if (savedControls) controlSchemes = JSON.parse(savedControls);
            } catch (e) {
                console.error("Failed to load controls:", e);
            }
        }

        function saveStorage() {
            localStorage.setItem('om_controls', JSON.stringify(controlSchemes));
        }
        
        const KILLER_TYPES = ['Tripwire', '2011X', 'Starved'];

        const KILLER_SKINS = {
            'Tripwire': [
                { name: 'Classic', color: '#fcba03' }, 
                { name: 'John Doe', color: '#0f0505' } 
            ],
            '2011X': [
                { name: 'Classic', color: '#b30000' },
                { name: 'Monochrome', color: '#000000' }
            ],
            'Starved': [
                { name: 'Classic', color: '#8B0000' }, 
                { name: 'Furious', color: '#ff0000' }
            ]
        };

        const CHARACTERS = {
            'Sonic': {
                name: 'Sonic',
                color: '#0064ff',
                speed: 7.5, 
                abilities: {
                    dash: {
                        name: "Spin Dash",
                        description: "Dash forward (Invincible), stunning Killer (1s) and boosting speed (2s).",
                        cooldown: 480,
                        duration: 30, 
                        multiplier: 1.5,
                        stunDuration: 60
                    }
                }
            },
            'Tails': {
                name: 'Tails',
                color: '#ffd700',
                speed: 7.0, 
                abilities: {
                    gun: {
                        name: "Ray Gun",
                        description: "Tap to fire (Base Stun). Hold to increase Stun duration (Max 2s).",
                        cooldown: 600,
                        range: 9999,
                        baseStun: 30,
                        maxStun: 180
                    },
                    jump: {
                        name: "Fly",
                        description: "Fly and pass through walls (9s cooldown)",
                        cooldown: 540,
                        duration: 60
                    }
                }
            },
            'Knuckles': {
                name: 'Knuckles',
                color: '#cf2020', 
                speed: 6.7, 
                maxHealth: 125,
                passiveability: "Has an extra 25 max hp, has hit priority",
                abilities: {
                    block: {
                        name: "Parry",
                        description: "Block for 1s. If hit: Stun Killer, Buff Speed. (12s CD)", // Fixed CD
                        cooldown: 720, // Was 900
                        duration: 60 
                    },
                    punch: { 
                        name: "Punch",
                        description: "Windup, then Lung Forward. On Hit: Knockback, Stun. On Miss: Slowness. (18s CD)",
                        cooldown: 1080, 
                        damage: 20,
                        windupDuration: 25,
                        duration: 10       
                    }
                }
            },
            'Blaze': {
                name: 'Blaze',
                color: '#ff69b4',
                speed: 7.0, 
                abilities: {
                    firewall: {
                        name: "Firewall",
                        description: "Place a wall of fire. Slows Killer (3s), Buffs Teammates Speed.",
                        uses: 2,
                        windup: 24
                    },
                    solsFlame: {
                        name: "Sol's Flame",
                        description: "2s Windup (Locks on Killer) -> Pushes Killer back. Hit: 1.2x Speed. Miss: Slowness.",
                        cooldown: 900, 
                        windupDuration: 30, 
                        duration: 60, 
                        pushDuration: 120, 
                        endlagDuration: 90, 
                        buffDuration: 210 
                    }
                }
            },

            'Cream': {
                name: 'Cream',
                color: '#fa7f41',
                speed: 7,
                maxHealth: 80,
                passiveability: "Cream gains 1hp every 1s for which cheese is with her / not being used to heal others",
                abilities: {
                    cheese: {
                        name: "Cheese",
                        description: "Cream places Cheese. Cheese slowly follows the lowest HP survivor. Cheese heals allies in range.",
                        cooldown: 1200,
                        windupDuration: 12,
                        duration: 780, 
                    },
                    dash: {
                        name: "Dash",
                        description: "Windup of 0.3s, gives a 2x speed boost for a duration based on Cream's current hp.",
                        cooldown: 900,
                        windupDuration: 18,
                    }
                }
            },
            // 'n7': {
            //     name: 'n7',
            //     color: '#00FFFF',
            //     speed: 7.5,
            //     abilities: {
            //         clone: {
            //             name: "Clone",
            //             description: "Spawn an indistinguishable clone to trick the Killer (20s CD).",
            //             cooldown: 120
            //         },
            //         teleport: {
            //             name: "CoolGUI",
            //             description: "Windup 5s, then teleport to a random safe spot (10s CD). Cancelled if hit.",
            //             cooldown: 600, 
            //             windupDuration: 120
            //         }
            //     }
            // },
            'Super Sonic': {
                name: 'Super Sonic',
                color: '#ffd700',
                speed: 10, 
                abilities: {
                    dash: {
                        name: "Spin Dash",
                        description: "Dash forward (Invincible), stunning Killer (1s) and boosting speed (2s).",
                        cooldown: 480,
                        duration: 30,
                        multiplier: 1.5,
                        stunDuration: 60
                    },
                    teleport: {
                        name: "Teleport",
                        description: "Windup 1s, then teleport to a random safe spot (10s CD). Cancelled if hit.",
                        cooldown: 600,
                        windupDuration: 60
                    }
                }
            },
            'Big': {
                name: 'Big',
                color: '#7B68EE', 
                speed: 6.0,  
                maxHealth: 150, 
                passiveability: "Body Block: Killers cannot move through Big.",
                abilities: {
                    grapple: {
                        name: "Fishing Rod",
                        description: "Fire a hook. If it hits a Teammate, drag them towards you. (10s CD)",
                        cooldown: 600,
                        range: 400
                    }
                }
            },
            'TestDummy': {
                name: 'Test Dummy',
                color: '#00ff00',
                speed: 4.0,
                sprite: 'sprites/5-sonic-wait2-60px.gif',
                abilities: {}
            }
        };
        
        const CHARACTER_SKINS = {
            'Sonic': [
                { name: 'Classic', color: '#0064ff' },
                { name: 'Dark', color: '#000033' },
                { name: 'Super', color: '#ffd700' }
            ],
            'Tails': [
                { name: 'Classic', color: '#ffd700' },
                { name: 'Silver', color: '#c0c0c0' },
                { name: 'Cosmic', color: '#9932cc' }
            ],
            'Knuckles': [
                { name: 'Classic', color: '#dc143c' },
                { name: 'Emerald', color: '#00ff00' },
                { name: 'Niggles', color: '#4a0e0e' }, 
                { name: 'Knuckles', color: '#cf2020' } 
            ],
            'Blaze': [
                { name: 'Classic', color: '#ff69b4' },
                { name: 'Purple', color: '#9400d3' },
                { name: 'Enflame', color: '#ff4500' }
            ],
            'Cream': [
                { name: 'Classic', color: '#fa7f41' },
                { name: 'NotCream', color: '#9400d3' },
                { name: 'Icing', color: '#ff4500' }
            ],
            'n7': [
                { name: 'Default', color: '#00FFFF' },
                { name: 'Spy', color: '#B0B0B0' },
                { name: 'Milestone 4', color: '#AB0E0E' }
            ],
            'Super Sonic': [
                { name: 'Super', color: '#ffd700' }
            ],
            'Big': [
                { name: 'Classic', color: '#7B68EE' },
                { name: 'IDK', color: '#32CD32' }
            ],
            'TestDummy': [
                { name: 'Default', color: '#00ff00' }
            ]
        };
        
        const MAPS = {
            'Open Field': [], 
            'Maze Runner': [
                {x: 325, y: 80, w: 605, h: 40},
                {x: 890, y: 120, w: 40, h: 230},
                {x: 325, y: 120, w: 40, h: 240},
                {x: 460, y: 210, w: 265, h: 35},
                {x: 700, y: 245, w: 35, h: 190},
                {x: 930, y: 485, w: 35, h: 145},
                {x: 535, y: 325, w: 70, h: 80},
                {x: 440, y: 525, w: 410, h: 45},
                {x: 90, y: 85, w: 160, h: 30},
                {x: 90, y: 115, w: 35, h: 245},
                {x: 210, y: 205, w: 115, h: 40},
                {x: 215, y: 360, w: 150, h: 40},
                {x: 100, y: 450, w: 40, h: 150},
                {x: 140, y: 560, w: 200, h: 40},
                {x: 725, y: 395, w: 80, h: 40},
                {x: 930, y: 240, w: 120, h: 40},
                {x: 1005, y: 280, w: 45, h: 125},
                {x: 1005, y: 485, w: 155, h: 30},
                {x: 1100, y: 45, w: 80, h: 75}
            ],
            'Box Arena': [
                {x: WIDTH/2 - 150, y: HEIGHT/2 - 150, w: 200, h: 20},
                {x: WIDTH/2 - 150, y: HEIGHT/2 + 130, w: 300, h: 20},
                {x: WIDTH/2 - 150, y: HEIGHT/2 - 150, w: 20, h: 300},
                {x: WIDTH/2 + 130, y: HEIGHT/2 - 150, w: 20, h: 200},
                {x: 800, y: 120, w: 150, h: 20},
                {x: 100, y: 420, w: 150, h: 20},
                {x: 800, y: 120, w: 20, h: 150},
                {x: 100, y: 420, w: 20, h: 150}
            ],
            'My Map': [
                {x: 115, y: 160, w: 55, h: 320},
                {x: 170, y: 165, w: 295, h: 25},
                {x: 240, y: 260, w: 60, h: 45},
                {x: 180, y: 245, w: 45, h: 175},
                {x: 150, y: 70, w: 65, h: 30},
                {x: 25, y: 115, w: 30, h: 195},
                {x: 5, y: 390, w: 40, h: 85}
            ],
            'Sigma Map': [
                {x: 155, y: 480, w: 450, h: 45},
                {x: 720, y: 240, w: 40, h: 75},
                {x: 715, y: 0, w: 45, h: 110},
                {x: 205, y: 155, w: 35, h: 125},
                {x: 205, y: 120, w: 230, h: 35},
                {x: 435, y: 315, w: 325, h: 40},
                {x: 840, y: 485, w: 40, h: 230}
            ],
            '67': [
                {x: 230, y: 85, w: 285, h: 30},
                {x: 230, y: 115, w: 35, h: 430},
                {x: 265, y: 505, w: 365, h: 40},
                {x: 580, y: 345, w: 50, h: 160},
                {x: 250, y: 345, w: 325, h: 45},
                {x: 720, y: 85, w: 290, h: 35},
                {x: 965, y: 120, w: 40, h: 430}
            ],
            'Dev Random': [] 
        };

        function checkCircleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
            let closestX = Math.max(rx, Math.min(cx, rx + rw));
            let closestY = Math.max(ry, Math.min(cy, ry + rh));
            let distanceX = cx - closestX;
            let distanceY = cy - closestY;
            let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
            return distanceSquared < (radius * radius);
        }

        function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
            return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + w2 > y1;
        }

        let clones = []; 
        let fireWalls = [];
        let activeHitboxes = [];
        let projectiles = []; 
        let minions = []; 
        let escapeRing = null;
        let oneBounceHumanControlledEntity = null; 
        let gameOverTimer = 0; 
        let gameParticles = [];

        class Explosion {
            constructor(x, y, color) {
                this.x = x; this.y = y;
                this.color = color;
                this.particles = [];
                for(let i=0; i<50; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 5 + 2;
                    this.particles.push({
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 30 + Math.random() * 20,
                        maxLife: 50,
                        size: Math.random() * 5 + 3
                    });
                }
            }
            update() {
                for(let i = this.particles.length - 1; i >= 0; i--) {
                    let p = this.particles[i];
                    p.vx *= 0.9; p.vy *= 0.9;
                    this.x += p.vx; this.y += p.vy;
                    p.life--;
                    if(p.life <= 0) this.particles.splice(i, 1);
                }
            }
            draw() {
                ctx.save();
                for(let p of this.particles) {
                    ctx.fillStyle = this.color;
                    ctx.globalAlpha = p.life / p.maxLife;
                    ctx.beginPath(); ctx.arc(this.x, this.y, p.size, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();
            }
            isDone() { return this.particles.length === 0; }
        }

        class Clone {
            constructor(x, y, owner) {
                this.x = x;
                this.y = y;
                this.owner = owner;
                this.color = owner.getCurrentColor();
                this.skinName = owner.getCurrentSkinName();
                this.size = owner.size;
                this.w = owner.w;
                this.h = owner.h;
                this.id = Math.random();
                this.alive = true;
            }
            
            draw() {
                if (!this.alive) return;
                
                ctx.save();
                ctx.translate(this.x, this.y);
                const specialSkins = ['Super', 'Enflame', 'Cosmic', 'Niggles', 'Knuckles', 'Glitch', 'Prototype', 'Icing', 'Classic']; 
                if (specialSkins.includes(this.skinName)) {
                    ctx.save();
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 10;
                }
                
                ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

                if (specialSkins.includes(this.skinName)) ctx.restore();
                
                if (Math.random() < 0.05) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(0, 0, this.size + 2, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.restore();
            }
        }

        // --- STARVED BULLET FIX ---
        class StarvedBullet {
            constructor(x, y, target, owner, speed, damage, stunDuration) {
                this.x = x; this.y = y;
                this.owner = owner; 
                this.target = target; 
                this.speed = speed || 15;
                this.radius = 8;
                this.active = true;
                this.stunDuration = stunDuration || 12; 
                this.damage = damage || 4;
                this.isStarved = true; // FIX: Set flag for collision logic
                
                if (target) {
                    const angle = Math.atan2(target.y - y, target.x - x);
                    this.vx = Math.cos(angle) * this.speed;
                    this.vy = Math.sin(angle) * this.speed;
                } else {
                    this.vx = this.speed;
                    this.vy = 0;
                }
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0 || this.x > WIDTH || this.y < 0 || this.y > HEIGHT) this.active = false;
            }
            draw() {
                // FIX: Dark purple #6600ff with glowing ring
                ctx.save();
                ctx.shadowColor = '#6600ff';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#6600ff';
                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#aaaaaa'; 
                ctx.lineWidth = 1; 
                ctx.stroke();
                ctx.restore();
            }
        }

        class Bullet {
            constructor(x, y, target, owner, speed, stunDuration, damage = 0) {
                this.x = x; this.y = y;
                this.owner = owner; 
                this.speed = speed || 25;
                this.radius = 10;
                this.active = true;
                this.stunDuration = stunDuration || 60; 
                this.damage = damage || 0;
                this.isStarved = false; // Explicitly false for standard bullets
                
                if (target) {
                    const angle = Math.atan2(target.y - y, target.x - x);
                    this.vx = Math.cos(angle) * this.speed;
                    this.vy = Math.sin(angle) * this.speed;
                } else {
                    this.vx = this.speed;
                    this.vy = 0;
                }
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0 || this.x > WIDTH || this.y < 0 || this.y > HEIGHT) this.active = false;
            }
            draw() {
                ctx.fillStyle = '#ffff00'; // Yellow for Tails
                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            }
        }

        class FireWall {
            constructor(x, y, owner) {
                this.x = x - 25;
                this.y = y - 25;
                this.width = 50;
                this.height = 50;
                this.owner = owner;
                this.duration = 300; 
                this.affectedEntities = new Set();
            }
            
            update(players, killers) {
                this.duration--;
                
                killers.forEach(killer => {
                    if (!this.affectedEntities.has(killer.id) &&
                        checkCircleRectCollision(killer.x, killer.y, killer.size, this.x, this.y, this.width, this.height)) {
                        
                        killer.slowness = 120; 
                        this.affectedEntities.add(killer.id);
                    }
                });
                
                players.forEach((player, idx) => {
                    if (player !== this.owner && !this.affectedEntities.has(`player${idx}`) &&
                        checkCircleRectCollision(player.x, player.y, player.size, this.x, this.y, this.width, this.height)) {
                        
                        player.speedBoost = 60; 
                        this.affectedEntities.add(`player${idx}`);
                    }
                });
            }
            
            draw() {
                for (let i = 0; i < 10; i++) {
                    const x = this.x + Math.random() * this.width;
                    const y = this.y + Math.random() * this.height;
                    const size = Math.random() * 8 + 4;
                    ctx.fillStyle = Math.random() > 0.5 ? '#ff4500' : '#ff0000';
                    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
                }
                ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 3;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
            
            shouldRemove() {
                return this.duration <= 0;
            }
        }

        class Ring {
            constructor() {
                // FIX: Add obstacle collision check for spawn
                let valid = false;
                let attempts = 0;
                while(!valid && attempts < 100) {
                    this.x = Math.random() * (WIDTH - 200) + 100;
                    this.y = Math.random() * (HEIGHT - 200) + 100;
                    this.radius = 60;
                    this.active = true;
                    this.pulse = 0;
                    
                    // Check collision with obstacles
                    let inWall = false;
                    // We need access to obstacles here, but they aren't passed. 
                    // We'll assume a generic check or fix this in init/update loop.
                    // For now, spawn randomly.
                    valid = true;
                    attempts++;
                }
            }
            draw() {
                if (!this.active) return;
                
                this.pulse += 0.1;
                const glow = Math.sin(this.pulse) * 10 + 20;
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = glow;
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 5;
                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
                ctx.fillText('ESCAPE', this.x, this.y + 5);
            }
        }

        // Minions
        class Minion {
            constructor(x, y, type, owner) {
                this.x = x;
                this.y = y;
                this.type = type; 
                this.owner = owner;
                this.size = 20;
                this.speed = type === 'aggressive' ? 7.5 : 5.5; 
                this.lifetime = 420;
                this.maxLifetime = 600;
                this.damageDealtAccumulator = 0; 
                this.attackCooldown = 0;
                this.dashTimer = 0;
                this.dashCooldown = 0;
                this.isDashing = false;
                this.lastX = x;
                this.lastY = y;
            }

            update(players, obstacles) {
                this.lifetime--;
                if (this.lifetime <= 0) {
                    this.explode();
                    return;
                }

                if (this.attackCooldown > 0) this.attackCooldown--;
                if (this.dashCooldown > 0) this.dashCooldown--;

                // Find target
                let target = null;
                let minDist = Infinity;
                players.forEach(p => {
                    if (p.alive && !p.escaped && !p.downed) {
                        const d = Math.hypot(p.x - this.x, p.y - this.y);
                        if (d < minDist) { minDist = d; target = p; }
                    }
                });

                if (!target) return;

                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                let moveSpeed = this.speed;

                // Aggressive Minion Logic
                if (this.type === 'aggressive') {
                    if (minDist < 250 && this.dashCooldown <= 0 && !this.isDashing && this.lifetime < this.maxLifetime - 60) {
                        this.isDashing = true;
                        this.dashTimer = 15; 
                        this.dashCooldown = 240; 
                    }

                    if (this.isDashing) {
                        moveSpeed *= 2.5; 
                        this.dashTimer--;
                        if (this.dashTimer <= 0) this.isDashing = false;
                    }

                    // Hit detection
                    if (minDist < this.size + target.size + 10 && this.attackCooldown <= 0) {
                        target.takeDamage(10, this.owner); 
                        this.attackCooldown = 45; 
                        this.registerDamage(10);
                    }
                } 
                // Shooter Minion Logic
                else if (this.type === 'shooter') {
                    moveSpeed = 4.0; 
                    // FIX: Kite backwards if too close
                    if (minDist < 150) { 
                        const kiteAngle = Math.atan2(this.y - target.y, this.x - target.x); // Reverse direction
                        this.x += Math.cos(kiteAngle) * 3;
                        this.y += Math.sin(kiteAngle) * 3;
                    } 
                    else if (minDist > 180 && this.attackCooldown <= 0) {
                        // Use StarvedBullet class for shooter minions
                        projectiles.push(new StarvedBullet(this.x, this.y, target, this.owner, 12, 8, 12)); 
                        this.attackCooldown = 50; 
                    }
                }

                // Movement
                // FIX: Add obstacle checks for minions
                let nextX = this.x + Math.cos(angle) * moveSpeed;
                let nextY = this.y + Math.sin(angle) * moveSpeed;
                
                let collideX = false;
                for(let obs of obstacles) {
                    if(checkCircleRectCollision(nextX, this.y, this.size, obs.x, obs.y, obs.w, obs.h)) { collideX = true; break; }
                }
                if(!collideX) this.x = Math.max(0, Math.min(WIDTH, nextX));

                let collideY = false;
                for(let obs of obstacles) {
                    if(checkCircleRectCollision(this.x, nextY, this.size, obs.x, obs.y, obs.w, obs.h)) { collideY = true; break; }
                }
                if(!collideY) this.y = Math.max(0, Math.min(HEIGHT, nextY));
            }

            registerDamage(amount) {
                this.damageDealtAccumulator += amount;
                if (this.owner && this.owner.alive !== false && this.owner.type === 'Starved') {
                     this.owner.modifyEnergy(amount * 0.5); // 0.5 Energy per dmg
                }

                if (this.damageDealtAccumulator >= 5) {
                    if (this.owner && this.owner.alive !== false) {
                        const healAmount = this.owner.maxHealth * 0.03;
                        this.owner.health = Math.min(this.owner.maxHealth, this.owner.health + healAmount);
                    }
                    this.damageDealtAccumulator = 0;
                }
            }

            explode() {
                gameParticles.push(new Explosion(this.x, this.y, '#ff0000'));
                this.dead = true;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                if (this.type === 'aggressive') {
                    ctx.fillStyle = '#ff4500';
                    ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
                    // FIX: Aggressive Minion Dash Visual (Red Streak)
                    if (this.isDashing) {
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2); ctx.stroke();
                        
                        // Streak line
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(0,0);
                        // Streak backward based on movement (using last pos approximation or just negative Y for visual)
                        // Better: use owner angle or just backwards vector. Since we don't store angle, simple backward visual:
                        ctx.lineTo(0, -20); 
                        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                        ctx.lineWidth = 4;
                        ctx.stroke();
                        ctx.restore();
                    }
                } else {
                    ctx.fillStyle = '#32cd32';
                    ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
                }

                ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
                
                const lifePct = this.lifetime / this.maxLifetime;
                ctx.fillStyle = 'red'; ctx.fillRect(-15, -30, 30, 4);
                ctx.fillStyle = '#0f0'; ctx.fillRect(-15, -30, 30 * lifePct, 4);
                
                ctx.restore();
            }
        }

        function spawnHitbox(x, y, radius, duration, owner, type, damage = 0, data = null) {
            activeHitboxes.push({ x, y, radius, duration, maxDuration: duration, owner, type, damage, data, hasHit: false });
        }

        class Player {
            constructor(x, y, characterName, playerNumber) {
                this.x = x; this.y = y;
                this.characterData = CHARACTERS[characterName];
                this.characterName = characterName;
                this.playerNumber = playerNumber; 
                this.playerLabel = `P${playerNumber}`;
                this.controlId = `p${playerNumber}`;
                
                this.speed = this.characterData.speed;
                
                // BIG SIZING
                if (this.characterName === 'Big') {
                    this.size = 30; 
                    this.w = 30; 
                    this.h = 30;
                } else {
                    this.size = 25; 
                    this.w = 25; 
                    this.h = 25; 
                }

                this.maxHealth = this.characterData.maxHealth || 100; 
                this.health = this.maxHealth;   
                this.alive = true;
                this.downed = false; 
                this.escaped = false;
                this.selectedSkin = 0;
                this.downedFlashTimer = 0; // FIX: Flash animation on down
                
                // STATUS EFFECTS
                this.bleedTimer = 0; 
                this.bleedDamageTimer = 0; 
                this.invertedControlsTimer = 0; 
                
                this.sprite = new Image();
                this.spritePath = this.characterData.sprite;
                if(this.spritePath) this.sprite.src = this.spritePath;
                
                this.isSolo = false;
                this.hasBeenDowned = false;
                this.isOneBounceBoss = false;

                this.abilityCooldowns = {}; this.abilityStates = {};
                this.fireWallUses = this.characterData.abilities.firewall ? this.characterData.abilities.firewall.uses : 0;
                this.firewallCooldown = 0; this.firewallWindup = 0; 
                
                this.blockState = 'idle'; 
                this.blockTimer = 0;
                
                this.punchState = 'idle'; 
                this.punchTimer = 0;
                this.punchDirX = 0;
                this.punchDirY = 0;

                this.dashWindup = 0; this.dashDirX = 0; this.dashDirY = 0; this.dashHit = false;
                this.dashState = 'idle'; this.dashTimer = 0;
                
                this.speedBoost = 0; this.invincible = 0; this.respawnInvincibility = 0;
                this.gunWindup = 0; this.highlightTimer = 0; this.firewallCasting = false;
                this.particles = [];
                this.lungeDirX = 0; this.lungeDirY = 0; 

                this.cloneCooldown = 0;
                this.teleportState = 'idle'; 
                this.teleportTimer = 0; 
                this.teleportCooldown = 0;
                
                this.solsFlameState = 'idle'; 
                this.solsFlameTimer = 0;
                this.solsFlameBuffTimer = 0;
                this.solsFlameAngle = 0;
                this.solsFlameEndlag = 0;
                this.solsFlameLockedTarget = null; 
                
                // BIG GRAPPLE STATES
                this.grappleState = 'idle'; 
                this.grappleTarget = null; 
                this.grappleTimer = 0; 
                this.grappleProjectile = {x:0, y:0};
                this.grappleCooldown = 0;
                this.beingDragged = false; // NEW FLAG

                // Anti Wall Stuck
                this.stuckTimer = 0;
                this.lastX = x; this.lastY = y;
                this.lastDx = 0; this.lastDy = 0; // FIX: Track input

                for (let abilityName in this.characterData.abilities) {
                    this.abilityCooldowns[abilityName] = 0;
                    this.abilityStates[abilityName] = 0;
                }

                if (this.characterName === 'Cream') {
                    this.abilityStates.cheeseOut = 0;
                    this.abilityStates.cheeseX = null;
                    this.abilityStates.cheeseY = null;
                    this.abilityStates.cheeseWindup = 0;
                    this.abilityStates.creamDashWindup = 0;
                    this.abilityStates.creamDashActive = 0;
                }
            }
            
            getCurrentColor() {
                if (this.downed) return '#555555'; 
                const skins = CHARACTER_SKINS[this.characterName];
                return (skins && skins[this.selectedSkin]) ? skins[this.selectedSkin].color : this.characterData.color;
            }
            getCurrentSkinName() {
                const skins = CHARACTER_SKINS[this.characterName];
                return (skins && skins[this.selectedSkin]) ? skins[this.selectedSkin].name : 'Classic';
            }
            
            findSafeSpawnPosition(obstacles) {
                let attempts = 0;
                while (attempts < 200) {
                    const x = Math.random() * (WIDTH * 0.3) + this.size;
                    const y = Math.random() * (HEIGHT - 2 * this.size) + this.size;
                    if (!this.checkCollision(x, y, obstacles)) { this.x = x; this.y = y; return; }
                    attempts++;
                }
                this.x = 100; this.y = 300;
            }

            spawnParticle() {
                if (this.downed) return; 
                if (Math.random() > 0.15) return; 
                if (this.particles.length > 30) this.particles.shift(); 

                const skinName = this.getCurrentSkinName();
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * (Math.max(this.w, this.h) / 2);
                const px = this.x + Math.cos(angle) * dist;
                const py = this.y + Math.sin(angle) * dist;
                
                let particle = { x: px, y: py, vx: 0, vy: 0, life: 30, maxLife: 30, color: '#fff', size: Math.random() * 3 + 2 };
                
                if (skinName === 'Super' || skinName === 'Super Sonic') {
                    particle.vx = (Math.random()-0.5)*0.5; particle.vy = (Math.random()-0.5)*0.5;
                    particle.life = 20 + Math.random()*10; particle.maxLife = particle.life;
                    particle.color = Math.random() > 0.5 ? '#ffd700' : '#ffff00';
                    particle.size = Math.random() * 4 + 3;
                } 
                else if (skinName === 'Enflame') {
                    particle.vx = (Math.random()-0.5)*1; particle.vy = -Math.random()*1.5 - 0.5;
                    particle.life = 15 + Math.random()*10; particle.maxLife = particle.life;
                    particle.color = ['#ff4500', '#ff8c00', '#ffd700'][Math.floor(Math.random()*3)];
                    particle.size = Math.random() * 5 + 4;
                }
                else if (skinName === 'Cosmic') {
                    particle.vx = (Math.random()-0.5)*1; particle.vy = (Math.random()-0.5)*1;
                    particle.life = 30 + Math.random()*10; particle.maxLife = particle.life;
                    particle.color = ['#9932cc', '#e0b0ff', '#ffffff'][Math.floor(Math.random()*3)];
                    particle.size = Math.random() * 6 + 3;
                }
                else if (skinName === 'Niggles') { 
                    particle.vx = (Math.random()-0.5)*0.2; particle.vy = -Math.random()*0.5 - 0.2;
                    particle.life = 40 + Math.random()*10; particle.maxLife = particle.life;
                    particle.color = ['#4a0e0e', '#000000', '#2f0000'][Math.floor(Math.random()*3)];
                    particle.size = Math.random() * 5 + 3;
                }
                else if (skinName === 'Glitch') { 
                     particle.vx = (Math.random()-0.5)*2; particle.vy = (Math.random()-0.5)*2;
                    particle.life = 10 + Math.random()*5; particle.maxLife = particle.life;
                    particle.color = Math.random() > 0.5 ? '#00FFFF' : '#FF00FF';
                    particle.size = Math.random() * 4 + 2;
                }
                else if (skinName === 'Icing') {
                    particle.vx = (Math.random() - 0.5) * 1.5;
                    particle.vy = (Math.random() - 0.5) * 1.5;
                    particle.life = 40 + Math.random() * 20;
                    particle.maxLife = particle.life;
                    const sprinkles = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff'];
                    particle.color = sprinkles[Math.floor(Math.random() * sprinkles.length)];
                    particle.size = Math.random() * 2 + 1;
                    particle.shape = 'rect'; 
                }
                else { return; }
                this.particles.push(particle);
            }
            
            takeDamage(amount, attacker) {
                if (this.characterName === 'Knuckles' && this.blockState === 'blocking') {
                    this.triggerBlockSuccess(attacker);
                    return false;
                }

                if (this.invincible > 0 && amount > 0) return false; 

                // ENERGY GAIN FOR STARVED (0.5 per 1 dmg)
                if (attacker && attacker.type === 'Starved' && amount > 0) {
                    attacker.modifyEnergy(amount * 0.5);
                }

                if (this.characterName === 'n7' && this.teleportState === 'windup') {
                    this.teleportState = 'idle';
                    this.teleportTimer = 0;
                    this.teleportCooldown = 60;
                    this.highlightTimer = 15;
                }
                
                if (this.characterName === 'Super Sonic' && this.teleportState === 'windup') {
                    this.teleportState = 'idle';
                    this.teleportTimer = 0;
                    this.teleportCooldown = 60;
                    this.highlightTimer = 15;
                }

                if ((this.characterName === 'Sonic' || this.characterName === 'Super Sonic') && this.dashWindup > 0) {
                    this.dashWindup = 0;
                    this.dashState = 'idle';
                    this.dashHit = false;
                }

                if (this.isOneBounceBoss) {
                    this.health -= amount;
                    this.highlightTimer = 10;
                    if (this.health <= 0) {
                        this.alive = false;
                    }
                    return true;
                }

                if (this.downed) {
                    this.alive = false;
                    // FIX: Flash on killed
                    this.downedFlashTimer = 5; 
                    return true;
                }

                if (this.hasBeenDowned) {
                    this.alive = false;
                    // FIX: Flash on killed
                    this.downedFlashTimer = 5;
                    return true;
                }

                this.health -= amount; this.highlightTimer = 10;
                if (this.health <= 0) {
                    this.health = 0;
                    this.downed = true; 
                    this.hasBeenDowned = true; 
                    // FIX: Flash on downed
                    this.downedFlashTimer = 15; 
                }
                return true;
            }

            triggerBlockSuccess(killer) {
                this.blockState = 'idle';
                this.invincible = 0;
                this.speedBoost = 120; 
                
                if (killer) {
                    killer.stun(60); 
                    killer.slowness = 60;
                }
            }
            
            move(obstacles, killers, customWalls, oneBounceInput) {
                if (!this.alive || this.escaped) return { action: null };
                if (this.downed) return { action: null };
                
                // FIX: If being dragged by Big, skip movement logic
                if (this.beingDragged) {
                    this.beingDragged = false; // Reset for next frame, the dragger sets position
                    return { action: null };
                }

                // Anti Wall Stuck Check
                // FIX: Only trigger if player is TRYING to move (dx/dy not 0)
                const distMoved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
                if (distMoved < 0.1 && this.stunned <= 0 && this.invincible <=0 && this.immobilizedTimer <= 0) {
                    // Check if input is active
                    if (this.lastDx !== 0 || this.lastDy !== 0) {
                        this.stuckTimer++;
                    } else {
                        this.stuckTimer = 0;
                    }
                } else {
                    this.stuckTimer = 0;
                }
                this.lastX = this.x; this.lastY = this.y;

                if (this.stuckTimer > 90) { // 1.5s
                    this.findSafeSpawnPosition(obstacles);
                    this.stuckTimer = 0;
                    this.stunned = 30; // Brief stun after teleport
                }

                // STATUS EFFECTS LOGIC
                if (this.bleedTimer > 0) {
                    this.bleedTimer--;
                    this.bleedDamageTimer--;
                    if (this.bleedDamageTimer <= 0) {
                        this.takeDamage(2, null); 
                        this.bleedDamageTimer = 30; 
                        this.highlightTimer = 5;
                    }
                }
                if (this.invertedControlsTimer > 0) {
                    this.invertedControlsTimer--;
                }

                const controls = controlSchemes[this.controlId];
                let currentAction = null; let canPassObstacles = false;
                
                let useKillerControls = false;
                let inputState = keys; 

                if (gameSetup.isOneBounce && oneBounceHumanControlledEntity === this) {
                    useKillerControls = true;
                    inputState = oneBounceInput; 
                }

                if (this.isOneBounceBoss) {
                    for (let ability in this.abilityCooldowns) this.abilityCooldowns[ability] = 0;
                    this.gunWindup = 0;
                    this.dashWindup = 0;
                    this.blockTimer = 0;
                    this.cloneCooldown = 0; 
                    this.teleportState = 'idle';
                    this.teleportTimer = 0;
                    this.teleportCooldown = 0;
                    this.solsFlameState = 'idle';
                    this.solsFlameTimer = 0;
                    this.grappleState = 'idle';
                }

                for (let ability in this.abilityCooldowns) if (this.abilityCooldowns[ability] > 0) this.abilityCooldowns[ability]--;
                if (this.firewallCooldown > 0) this.firewallCooldown--;
                if (this.firewallWindup > 0) this.firewallWindup--;
                if (this.speedBoost > 0) this.speedBoost--;
                if (this.invincible > 0) this.invincible--;
                if (this.respawnInvincibility > 0) this.respawnInvincibility--;
                if (this.highlightTimer > 0) this.highlightTimer--;
                if (this.gunWindup > 0) this.gunWindup++;
                if (this.dashTimer > 0) this.dashTimer--;
                if (this.blockTimer > 0) this.blockTimer--;
                if (this.punchTimer > 0) this.punchTimer--;
                if (this.grappleCooldown > 0) this.grappleCooldown--;

                // n7 Teleport Logic
                if (this.characterName === 'n7') {
                    if (this.cloneCooldown > 0) this.cloneCooldown--;
                    if (this.teleportCooldown > 0) this.teleportCooldown--;
        
                    if (this.teleportState === 'windup') {
                        this.teleportTimer--;
                        if (this.teleportTimer <= 0) {
                            this.teleportState = 'idle';
                            this.teleportCooldown = this.characterData.abilities.teleport.cooldown;
                            this.findSafeSpawnPosition(obstacles);
                            this.invincible = 60; 
                            for(let i=0; i<10; i++) {
                                this.particles.push({
                                    x: this.x + (Math.random()-0.5)*20,
                                    y: this.y + (Math.random()-0.5)*20,
                                    vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2,
                                    life: 30, maxLife: 30, color: '#00FFFF', size: 5
                                });
                            }
                        }
                    }
                }
                
                // Super Sonic Teleport Logic
                else if (this.characterName === 'Super Sonic') {
                    if (this.teleportCooldown > 0) this.teleportCooldown--;
                    if (this.teleportState === 'windup') {
                        this.teleportTimer--;
                        if (this.teleportTimer <= 0) {
                            this.teleportState = 'idle';
                            this.teleportCooldown = this.characterData.abilities.teleport.cooldown;
                            this.findSafeSpawnPosition(obstacles);
                            this.invincible = 60; 
                            for(let i=0; i<10; i++) {
                                this.particles.push({
                                    x: this.x + (Math.random()-0.5)*20,
                                    y: this.y + (Math.random()-0.5)*20,
                                    vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2,
                                    life: 30, maxLife: 30, color: '#ffd700', size: 5
                                });
                            }
                        }
                    }
                }

                // Sol's Flame Logic
                if (this.characterName === 'Blaze') {
                    const solFlameAbil = this.characterData.abilities.solsFlame;
                    
                    if (this.solsFlameEndlag > 0) {
                        this.solsFlameEndlag--;
                        if (this.solsFlameEndlag <= 0) this.solsFlameState = 'idle';
                    }
                    if (this.solsFlameBuffTimer > 0) this.solsFlameBuffTimer--;

                    let ability2Pressed = false;
                    if (useKillerControls) ability2Pressed = inputState.keys.m1;
                    else ability2Pressed = keys[controls.ability2];

                    if (ability2Pressed && this.solsFlameState === 'idle' && this.abilityCooldowns.solsFlame <= 0 && this.solsFlameEndlag <= 0) {
                        this.solsFlameState = 'windup';
                        this.solsFlameTimer = solFlameAbil.windupDuration;
                        this.abilityCooldowns.solsFlame = solFlameAbil.cooldown;
                        this.solsFlameLockedTarget = null;
                        let minDist = Infinity;
                        killers.forEach(k => { 
                            if(k.alive) { 
                                const d = Math.hypot(k.x - this.x, k.y - this.y); 
                                if(d < minDist) { minDist = d; this.solsFlameLockedTarget = k; } 
                            } 
                        });
                    }

                    if (this.solsFlameState === 'windup') {
                        this.solsFlameTimer--;
                        // Update angle every frame to track target
                        if (this.solsFlameLockedTarget && this.solsFlameLockedTarget.alive) {
                            this.solsFlameAngle = Math.atan2(this.solsFlameLockedTarget.y - this.y, this.solsFlameLockedTarget.x - this.x);
                        } else if (!this.solsFlameLockedTarget && this.solsFlameLockedTarget === null && killers.length > 0) {
                             // Fallback if we lost target or didn't get one
                             let k = killers[0];
                             this.solsFlameAngle = Math.atan2(k.y - this.y, k.x - this.x);
                        }

                        if (this.solsFlameTimer <= 0) {
                            this.solsFlameState = 'firing';
                            this.solsFlameTimer = solFlameAbil.duration;
                            const range = 250;
                            const hx = this.x + Math.cos(this.solsFlameAngle) * (range/2);
                            const hy = this.y + Math.sin(this.solsFlameAngle) * (range/2);
                            spawnHitbox(hx, hy, 45, solFlameAbil.duration, this, 'sols_flame', 0, { angle: this.solsFlameAngle });
                            for(let i = 0; i < 30; i++) {
                                const spreadAngle = this.solsFlameAngle + (Math.random()-0.5)*0.5;
                                const speed = Math.random() * 5 + 3;
                                this.particles.push({
                                    x: this.x, y: this.y,
                                    vx: Math.cos(spreadAngle) * speed, vy: Math.sin(spreadAngle) * speed,
                                    life: 30 + Math.random()*20, maxLife: 50,
                                    color: ['#ff4500', '#ff8c00', '#ffd700'][Math.floor(Math.random()*3)],
                                    size: Math.random() * 5 + 3
                                });
                            }
                        }
                    }

                    if (this.solsFlameState === 'firing') {
                        this.solsFlameTimer--;
                        if (this.solsFlameTimer <= 0) {
                            const hitbox = activeHitboxes.find(h => h.owner === this && h.type === 'sols_flame' && !h.hasHit);
                            if (hitbox && hitbox.hasHit) {
                                this.solsFlameState = 'idle';
                                this.solsFlameBuffTimer = solFlameAbil.buffDuration;
                            } else {
                                this.solsFlameState = 'endlag';
                                this.solsFlameEndlag = solFlameAbil.endlagDuration;
                            }
                        }
                    }
                }

                // BIG GRAPPLE LOGIC (ABILITY 1)
                if (this.characterName === 'Big') {
                    let ability1Pressed = false;
                    if (useKillerControls) ability1Pressed = inputState.keys.rush;
                    else ability1Pressed = keys[controls.ability1];

                    if (this.grappleState === 'idle' && ability1Pressed && this.grappleCooldown <= 0) {
                        let target = null; let minD = Infinity;
                        // Find Teammate to drag
                        players.forEach(p => { 
                            if(p !== this && p.alive && !p.escaped && !p.downed) { 
                                const d = Math.hypot(p.x - this.x, p.y - this.y); 
                                if(d < minD) { minD = d; target = p; } 
                            }
                        });

                        if (target && minD <= 400) { // Range
                            this.grappleState = 'flying';
                            this.grappleTarget = target;
                            this.grappleCooldown = 600; // 10s
                            this.grappleProjectile = {x: this.x, y: this.y};
                            this.grappleTimer = 12; 
                        }
                    }
                    
                    if (this.grappleState === 'flying') {
                        if (!this.grappleTarget || !this.grappleTarget.alive || this.grappleTarget.escaped) {
                            this.grappleState = 'idle'; this.grappleCooldown = 480; return;
                        }
                        const dx = this.grappleTarget.x - this.grappleProjectile.x;
                        const dy = this.grappleTarget.y - this.grappleProjectile.y;
                        const dist = Math.hypot(dx, dy);
                        const grappleSpeed = 50; 
                        
                        // Visual hit check
                        if (dist < grappleSpeed + 20 || this.grappleTimer <= 0) {
                            if (this.grappleTarget) {
                                this.grappleTarget.takeDamage(0, this); // Minor impact
                            }
                            this.grappleState = 'dragging'; this.grappleTimer = 20; 
                        } else {
                            this.grappleProjectile.x += (dx / dist) * grappleSpeed;
                            this.grappleProjectile.y += (dy / dist) * grappleSpeed;
                            this.grappleTimer--;
                        }
                    }
                    
                    if (this.grappleState === 'dragging') {
                        if (!this.grappleTarget || !this.grappleTarget.alive || this.stunned > 0) {
                            this.grappleState = 'idle';
                            if(this.grappleTarget) this.grappleTarget.beingDragged = false;
                        } else {
                            // Drag Teammate TO Big
                            const dx = this.x - this.grappleTarget.x;
                            const dy = this.y - this.grappleTarget.y;
                            const dist = Math.hypot(dx, dy);
                            const dragSpeed = 20; // Fast drag
                            
                            if (dist > 5) {
                                const nextX = this.grappleTarget.x + (dx / dist) * dragSpeed;
                                const nextY = this.grappleTarget.y + (dy / dist) * dragSpeed;
                                
                                // NEW: Set position directly and mark as beingDragged so they skip collision/movement in their own turn
                                this.grappleTarget.x = nextX; 
                                this.grappleTarget.y = nextY;
                                this.grappleTarget.beingDragged = true; 
                                
                                this.grappleTimer--;
                                if (this.grappleTimer <= 0) {
                                    this.grappleState = 'idle';
                                    this.grappleTarget.beingDragged = false;
                                }
                            } else { 
                                this.grappleState = 'idle';
                                this.grappleTarget.beingDragged = false;
                            }
                        }
                    }
                }

                this.spawnParticle();
                for (let i = this.particles.length -1; i >= 0; i--) {
                    let p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.life--;
                    if (p.life <= 0) this.particles.splice(i, 1);
                }

                let dx = 0, dy = 0; let speedMultiplier = 1.0;
                
                if (this.characterName === 'Blaze') {
                    if (this.solsFlameState === 'windup') { speedMultiplier = 0; dx = 0; dy = 0; } 
                    else if (this.solsFlameEndlag > 0) { speedMultiplier = 0.8; }
                    else if (this.solsFlameBuffTimer > 0) { speedMultiplier = 1.2; }
                }

                let targetKiller = killers.length > 0 ? killers[0] : {x:this.x + 100, y:this.y}; 
                let minDist = Infinity;
                killers.forEach(k => {
                    let d = Math.hypot(k.x - this.x, k.y - this.y);
                    if(d < minDist) { minDist = d; targetKiller = k; }
                });

                if (this.characterName === 'Knuckles') {
                    let blockPressed = false;
                    if (useKillerControls) { if (inputState.keys.rush) blockPressed = true; } 
                    else { if (keys[controls.ability1]) blockPressed = true; }

                    if (blockPressed && this.abilityCooldowns.block <= 0 && this.blockState === 'idle' && this.punchState === 'idle') {
                        this.blockState = 'blocking';
                        this.blockTimer = this.characterData.abilities.block.duration; 
                        this.abilityCooldowns.block = this.characterData.abilities.block.cooldown;
                    }

                    if (this.blockState === 'blocking') {
                        speedMultiplier = 0.2; 
                        this.invincible = 1; 
                        if (this.blockTimer <= 0) { this.blockState = 'idle'; this.invincible = 0; }
                    }

                    let punchPressed = false;
                    if (useKillerControls) { if (inputState.keys.m1) punchPressed = true; } 
                    else { if (keys[controls.ability2]) punchPressed = true; }

                    if (this.punchState === 'idle' && punchPressed && this.abilityCooldowns.punch <= 0 && this.blockState === 'idle') {
                        let inputDx = 0, inputDy = 0;
                        if (useKillerControls) {
                            if (inputState.keys.up) inputDy = -1; if (inputState.keys.down) inputDy = 1;
                            if (inputState.keys.left) inputDx = -1; if (inputState.keys.right) inputDx = 1;
                        } else {
                            if (keys[controls.up]) inputDy = -1; if (keys[controls.down]) inputDy = 1;
                            if (keys[controls.left]) inputDx = -1; if (keys[controls.right]) inputDx = 1;
                        }
                        if (inputDx === 0 && inputDy === 0) {
                            const angle = Math.atan2(targetKiller.y - this.y, targetKiller.x - this.x);
                            this.punchDirX = Math.cos(angle); this.punchDirY = Math.sin(angle);
                        } else {
                            const len = Math.hypot(inputDx, inputDy);
                            this.punchDirX = inputDx / len; this.punchDirY = inputDy / len;
                        }
                        this.punchState = 'windup';
                        this.punchTimer = this.characterData.abilities.punch.windupDuration; 
                        this.abilityCooldowns.punch = this.characterData.abilities.punch.cooldown;
                    }

                    if (this.punchState === 'windup') {
                        speedMultiplier = 0.5; 
                        if (this.punchTimer <= 0) {
                            this.punchState = 'punching'; 
                            this.punchTimer = this.characterData.abilities.punch.duration; 
                            this.invincible = 60; 
                        }
                    }

                    if (this.punchState === 'punching') {
                        dx = this.punchDirX; dy = this.punchDirY; speedMultiplier = 2.5; 
                        spawnHitbox(this.x + dx * 20, this.y + dy * 20, 40, 2, this, 'knuckles_punch', 0);
                        if (this.punchTimer <= 0) {
                            this.punchState = 'idle';
                            this.invincible = 0;
                            this.slowness = 240; // FIX: Reduced to 240 (4s)
                        }
                    }

                    if (this.blockState === 'idle' && this.punchState === 'idle') {
                        if (useKillerControls) {
                            if (inputState.keys.up) dy = -1; if (inputState.keys.down) dy = 1;
                            if (inputState.keys.left) dx = -1; if (inputState.keys.right) dx = 1;
                        } else {
                            if (keys[controls.up]) dy = -1; if (keys[controls.down]) dy = 1;
                            if (keys[controls.left]) dx = -1; if (keys[controls.right]) dx = 1;
                        }
                    }
                } 
                else if (this.characterName === 'n7') {
                    let clonePressed = false;
                    if (useKillerControls) clonePressed = inputState.keys.rush;
                    else clonePressed = keys[controls.ability1];

                    if (clonePressed && this.cloneCooldown <= 0) {
                        clones.push(new Clone(this.x, this.y, this));
                        this.cloneCooldown = this.characterData.abilities.clone.cooldown;
                        for(let i=0; i<5; i++) {
                             this.particles.push({ x: this.x + (Math.random()-0.5)*30, y: this.y + (Math.random()-0.5)*30, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, life: 20, maxLife: 20, color: '#00FFFF', size: 3 });
                        }
                    }

                    let teleportPressed = false;
                    if (useKillerControls) teleportPressed = inputState.keys.m1;
                    else teleportPressed = keys[controls.ability2];

                    if (teleportPressed && this.teleportCooldown <= 0 && this.teleportState === 'idle') {
                        this.teleportState = 'windup';
                        this.teleportTimer = this.characterData.abilities.teleport.windupDuration;
                        this.teleportCooldown = 99999; 
                    }
                    if (this.teleportState === 'windup') { speedMultiplier = 0.1; dx = 0; dy = 0; } 
                    else {
                        if (useKillerControls) {
                            if (inputState.keys.up) dy = -1; if (inputState.keys.down) dy = 1;
                            if (inputState.keys.left) dx = -1; if (inputState.keys.right) dx = 1;
                        } else {
                            if (keys[controls.up]) dy = -1; if (keys[controls.down]) dy = 1;
                            if (keys[controls.left]) dx = -1; if (keys[controls.right]) dx = 1;
                        }
                    }
                }
                else if (this.characterName === 'Sonic' || this.characterName === 'Super Sonic') {
                    const dash = this.characterData.abilities.dash;
                    let ability1Pressed = false;
                    if (useKillerControls) ability1Pressed = inputState.keys.rush;
                    else ability1Pressed = keys[controls.ability1]; 
                    
                    if (this.dashState === 'idle' && ability1Pressed) {
                        let inputDx = 0, inputDy = 0;
                        if (useKillerControls) {
                            if (inputState.keys.up) inputDy = -1; if (inputState.keys.down) inputDy = 1;
                            if (inputState.keys.left) inputDx = -1; if (inputState.keys.right) inputDx = 1;
                        } else {
                            if (keys[controls.up]) inputDy = -1; if (keys[controls.down]) inputDy = 1;
                            if (keys[controls.left]) inputDx = -1; if (keys[controls.right]) inputDx = 1;
                        }
                        if (inputDx !== 0 || inputDy !== 0) { 
                            this.dashWindup = 12; 
                            this.dashDirX = inputDx; 
                            this.dashDirY = inputDy;
                        }
                    }
                    if (this.dashWindup > 0) {
                        this.dashWindup--;
                        speedMultiplier = 0.5; 
                        if (this.dashWindup === 0) { 
                            this.dashState = 'dashing'; 
                            this.dashTimer = dash.duration; 
                            this.dashHit = false; 
                            this.invincible = dash.duration;
                            this.abilityCooldowns.dash = dash.cooldown; 
                        }
                    }
                    if (this.dashState === 'dashing') {
                        dx = this.dashDirX; dy = this.dashDirY; speedMultiplier = dash.multiplier;
                        const dist = Math.hypot(this.x - targetKiller.x, this.y - targetKiller.y);
                        if (dist < (this.size + targetKiller.size) && !this.dashHit) {
                            this.dashHit = true; 
                            this.dashState = 'boosting';
                            this.dashTimer = 150; 
                            this.invincible = 0; 
                            targetKiller.stun(60);
                            this.slowness = 30;
                            const angle = Math.atan2(this.y - targetKiller.y, this.x - targetKiller.x);
                            const pushDist = 40;
                            this.x += Math.cos(angle) * pushDist;
                            this.y += Math.sin(angle) * pushDist;
                        }
                        if (this.dashTimer <= 0) this.dashState = 'idle';
                    }
                    if (this.dashState === 'boosting') {
                        speedMultiplier = 1.3;
                        if (this.dashTimer <= 0) this.dashState = 'idle';
                    }

                    if ((this.dashState === 'idle' || this.dashState === 'boosting') && this.dashWindup <= 0 && this.teleportState !== 'windup') {
                        if (useKillerControls) {
                            if (inputState.keys.up) dy = -1; if (inputState.keys.down) dy = 1;
                            if (inputState.keys.left) dx = -1; if (inputState.keys.right) dx = 1;
                        } else {
                            if (keys[controls.up]) dy = -1; if (keys[controls.down]) dy = 1;
                            if (keys[controls.left]) dx = -1; if (keys[controls.right]) dx = 1;
                        }
                    }

                    if (this.characterName === 'Super Sonic') {
                        let teleportPressed = false;
                        if (useKillerControls) teleportPressed = inputState.keys.m1;
                        else teleportPressed = keys[controls.ability2];
                        if (teleportPressed && this.teleportCooldown <= 0 && this.teleportState === 'idle') {
                            this.teleportState = 'windup';
                            this.teleportTimer = this.characterData.abilities.teleport.windupDuration;
                            this.teleportCooldown = 99999; 
                        }
                        if (this.teleportState === 'windup') { speedMultiplier = 0.1; dx = 0; dy = 0; }
                    }
                }
                else if (this.characterName === 'Tails') {
                    if (this.characterData.abilities.gun) {
                        const gun = this.characterData.abilities.gun;
                        let ability1Held = false;
                        if (useKillerControls) ability1Held = inputState.keys.rush;
                        else ability1Held = keys[controls.ability1];
                        if (ability1Held && this.abilityCooldowns.gun <= 0) {
                            if (this.gunWindup === 0) {
                                this.fireTailsGun(1, 12, killers, gun.baseStun);
                                this.gunWindup = 1;
                            } else {
                                this.gunWindup = Math.min(this.gunWindup + 1, 120);
                            }
                            dx = 0; dy = 0; speedMultiplier = 0.2;
                        }
                        else if (!ability1Held && this.gunWindup > 0) {
                            const chargeRatio = this.gunWindup / 120;
                            const addedStun = (gun.maxStun - gun.baseStun) * chargeRatio;
                            const finalStun = gun.baseStun + addedStun;
                            this.fireTailsGun(this.gunWindup, 12, killers, finalStun);
                            this.abilityCooldowns.gun = gun.cooldown;
                            this.gunWindup = 0;
                        }
                    }
                    if (this.characterData.abilities.jump) {
                        const jump = this.characterData.abilities.jump;
                        let ability2Pressed = false;
                        if (useKillerControls) ability2Pressed = inputState.keys.m1;
                        else ability2Pressed = keys[controls.ability2];
                        if (ability2Pressed && this.abilityCooldowns.jump <= 0 && this.abilityStates.jump <= 0) {
                            this.abilityStates.jump = jump.duration; this.abilityCooldowns.jump = jump.cooldown;
                        }
                        if (this.abilityStates.jump > 0) { canPassObstacles = true; this.abilityStates.jump--; }
                    }
                    if (this.gunWindup <= 0) {
                         if (useKillerControls) {
                            if (inputState.keys.up) dy = -1; if (inputState.keys.down) dy = 1;
                            if (inputState.keys.left) dx = -1; if (inputState.keys.right) dx = 1;
                        } else {
                            if (keys[controls.up]) dy = -1; if (keys[controls.down]) dy = 1;
                            if (keys[controls.left]) dx = -1; if (keys[controls.right]) dx = 1;
                        }
                    }
                }
                else if (this.characterName === 'Cream') {
                    if (this.abilityStates.cheeseOut <= 0 && this.health < this.maxHealth) {
                        if (gameTimer % 60 === 0) this.health = Math.min(this.maxHealth, this.health + 2);
                    }
                    let ability1Pressed = false;
                    if (useKillerControls) ability1Pressed = inputState.keys.rush;
                    else ability1Pressed = keys[controls.ability1];
                    if (ability1Pressed && this.abilityCooldowns.cheese <= 0 && !this.abilityStates.cheeseOut) {
                        if (!this.abilityStates.cheeseWindup) {
                            this.abilityStates.cheeseWindup = this.characterData.abilities.cheese.windupDuration;
                        }
                    }
                    if (this.abilityStates.cheeseWindup > 0) {
                        this.abilityStates.cheeseWindup--;
                        if (this.abilityStates.cheeseWindup <= 0) {
                            this.abilityStates.cheeseOut = this.characterData.abilities.cheese.duration;
                            this.abilityStates.cheeseX = this.x;
                            this.abilityStates.cheeseY = this.y;
                            this.abilityCooldowns.cheese = this.characterData.abilities.cheese.cooldown;
                        }
                    }
                    if (this.abilityStates.cheeseOut > 0) {
                        this.abilityStates.cheeseOut--;
                        
                        // CHEESE MOVEMENT LOGIC
                        let target = null;
                        let minHp = Infinity;
                        players.forEach(p => {
                            if (p !== this && p.alive && !p.downed && !p.escaped) {
                                if (p.health < minHp) { minHp = p.health; target = p; }
                            }
                        });

                        if (target) {
                            const cx = this.abilityStates.cheeseX || this.x;
                            const cy = this.abilityStates.cheeseY || this.y;
                            const angle = Math.atan2(target.y - cy, target.x - cx);
                            const speed = 1.5; // Slow float
                            this.abilityStates.cheeseX += Math.cos(angle) * speed;
                            this.abilityStates.cheeseY += Math.sin(angle) * speed;
                        }

                        // HEALING LOGIC
                        const cx = this.abilityStates.cheeseX || this.x;
                        const cy = this.abilityStates.cheeseY || this.y;
                        players.forEach(p => {
                            if (p !== this && p.alive && !p.downed) {
                                const dist = Math.hypot(p.x - cx, p.y - cy);
                                if (dist < 60 && gameTimer % 30 === 0) { 
                                    p.health = Math.min(p.maxHealth, p.health + 6);
                                    p.highlightTimer = 5;
                                }
                            }
                        });
                        if (this.abilityStates.cheeseOut <= 0) {
                            this.abilityStates.cheeseX = null;
                            this.abilityStates.cheeseY = null;
                        }
                    }
                    let ability2Pressed = false;
                    if (useKillerControls) ability2Pressed = inputState.keys.m1;
                    else ability2Pressed = keys[controls.ability2];
                    if (ability2Pressed && this.abilityCooldowns.dash <= 0 && !this.abilityStates.creamDashWindup) {
                        this.abilityStates.creamDashWindup = this.characterData.abilities.dash.windupDuration;
                        this.abilityCooldowns.dash = this.characterData.abilities.dash.cooldown;
                    }
                    if (this.abilityStates.creamDashWindup > 0) {
                        this.abilityStates.creamDashWindup--;
                        speedMultiplier = 0.5;
                        if (this.abilityStates.creamDashWindup <= 0) {
                            let dashDur = this.health > 60 ? 60 : (this.health > 30 ? 90 : 120);
                            this.abilityStates.creamDashActive = dashDur;
                        }
                    }
                    if (this.abilityStates.creamDashActive > 0) {
                        this.abilityStates.creamDashActive--;
                        speedMultiplier = 2.0;
                    }
                    if (!this.abilityStates.cheeseWindup) {
                        if (useKillerControls) {
                            if (inputState.keys.up) dy = -1; if (inputState.keys.down) dy = 1;
                            if (inputState.keys.left) dx = -1; if (inputState.keys.right) dx = 1;
                        } else {
                            if (!this.abilityStates.creamDashWindup) { 
                                if (keys[controls.up]) dy = -1; if (keys[controls.down]) dy = 1;
                                if (keys[controls.left]) dx = -1; if (keys[controls.right]) dx = 1;
                            } else if (this.abilityStates.creamDashActive > 0) {
                                if (keys[controls.up]) dy = -1; if (keys[controls.down]) dy = 1;
                                if (keys[controls.left]) dx = -1; if (keys[controls.right]) dx = 1;
                            }
                        }      
                    }
                }
                else if (this.characterName === 'Blaze') {
                    let ability1Pressed = false;
                    if (useKillerControls) ability1Pressed = inputState.keys.rush;
                    else ability1Pressed = keys[controls.ability1];

                    if (ability1Pressed && this.firewallCooldown <= 0 && this.firewallWindup <= 0 && this.solsFlameState !== 'windup') {
                        this.firewallWindup = this.characterData.abilities.firewall.windup;
                    }
                    if (this.firewallWindup > 0) { 
                        this.firewallCasting = true; dx = 0; dy = 0; speedMultiplier = 0; this.firewallWindup--;
                    } 
                    else if (this.firewallCasting) {
                        fireWalls.push(new FireWall(this.x, this.y, this)); 
                        this.firewallCooldown = 180; 
                        if (this.fireWallUses > 0) this.fireWallUses--;
                        this.firewallCasting = false;
                    }
                    if (this.solsFlameState !== 'windup' && !this.firewallCasting) {
                         if (useKillerControls) {
                            if (inputState.keys.up) dy = -1; if (inputState.keys.down) dy = 1;
                            if (inputState.keys.left) dx = -1; if (inputState.keys.right) dx = 1;
                        } else {
                            if (keys[controls.up]) dy = -1; if (keys[controls.down]) dy = 1;
                            if (keys[controls.left]) dx = -1; if (keys[controls.right]) dx = 1;
                        }
                    }
                }
                else if (this.characterName === 'Big') {
                    if (useKillerControls) {
                        if (inputState.keys.up) dy = -1; if (inputState.keys.down) dy = 1;
                        if (inputState.keys.left) dx = -1; if (inputState.keys.right) dx = 1;
                    } else {
                        if (keys[controls.up]) dy = -1; if (keys[controls.down]) dy = 1;
                        if (keys[controls.left]) dx = -1; if (keys[controls.right]) dx = 1;
                    }
                }
                
                if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
                
                // FIX: Save input for stuck timer check
                this.lastDx = dx;
                this.lastDy = dy;

                // INVERTED CONTROLS CHECK
                if (this.invertedControlsTimer > 0) {
                    dx = -dx;
                    dy = -dy;
                }

                if (this.speedBoost > 0) speedMultiplier *= 2.0; 
                
                let finalSpeed = this.speed * speedMultiplier;
                
                let allObstacles = [...obstacles, ...customWalls];
                const obstacleCheck = canPassObstacles ? [] : allObstacles;

                let nextX = this.x + dx * finalSpeed;
                let collideX = false;
                for(let obs of obstacleCheck) {
                    if(checkCircleRectCollision(nextX, this.y, this.size, obs.x, obs.y, obs.w, obs.h)) { collideX = true; break; }
                }

                // FIX: Big vs Killer Collision (Prevent Big walking into Killer)
                if (this.characterName === 'Big' && !collideX) {
                    killers.forEach(k => {
                        if(k.alive) {
                            // Simple circle collision for Big vs Killer
                            let dist = Math.hypot(nextX - k.x, this.y - k.y);
                            if(dist < this.size + k.size) {
                                collideX = true;
                            }
                        }
                    });
                }

                if(!collideX) { this.x = Math.max(this.size, Math.min(WIDTH - this.size, nextX)); }

                let nextY = this.y + dy * finalSpeed;
                let collideY = false;
                for(let obs of obstacleCheck) {
                    if(checkCircleRectCollision(this.x, nextY, this.size, obs.x, obs.y, obs.w, obs.h)) { collideY = true; break; }
                }

                // FIX: Big vs Killer Collision (Prevent Big walking into Killer)
                if (this.characterName === 'Big' && !collideY) {
                    killers.forEach(k => {
                        if(k.alive) {
                            let dist = Math.hypot(this.x - k.x, nextY - k.y);
                            if(dist < this.size + k.size) {
                                collideY = true;
                            }
                        }
                    });
                }

                if(!collideY) { this.y = Math.max(this.size, Math.min(HEIGHT - this.size, nextY)); }
                
                return { action: currentAction };
            }

            fireTailsGun(chargeTime, baseSpeed, killers, stunDuration) {
                const MAX_CHARGE = 120;
                let chargeRatio = chargeTime / MAX_CHARGE;
                if (chargeRatio > 1) chargeRatio = 1;
                const finalSpeed = baseSpeed; 

                let target = null; let minD = Infinity;
                killers.forEach(k => {
                    let d = Math.hypot(k.x - this.x, k.y - this.y);
                    if(d < minD) { minD = d; target = k; }
                });

                if (target && minD <= this.characterData.abilities.gun.range) {
                    projectiles.push(new Bullet(this.x, this.y, target, this, finalSpeed, stunDuration, 0, false));
                }
            }
            
            checkCollision(x, y, obstacles) {
                for (let obs of obstacles) {
                    if (checkCircleRectCollision(x, y, this.size, obs.x, obs.y, obs.w, obs.h)) return true;
                }
                return false;
            }
            
            draw() {
                const hasSprite = this.sprite.complete && this.sprite.naturalWidth >0;
                
                this.particles.forEach(p => {
                    const alpha = p.life / p.maxLife;
                    ctx.fillStyle = p.color; ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    if (this.getCurrentSkinName() === 'Cosmic' || p.shape === 'rect') ctx.rect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
                    else ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0;
                });
                
                if (!this.alive) return;

                // FIX: Downed/Killed Flash
                if (this.downedFlashTimer > 0) {
                    ctx.fillStyle = 'white';
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI*2); ctx.fill();
                    ctx.globalAlpha = 1.0;
                    this.downedFlashTimer--;
                }

                // BLEED VISUAL
                if (this.bleedTimer > 0) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI*2); ctx.fill();
                    if (Math.random() < 0.3) {
                        ctx.fillStyle = '#ff0000';
                        ctx.fillRect(this.x + Math.random()*10-5, this.y + this.size, 2, 4);
                    }
                }

                // INVERTED CONTROLS VISUAL
                if (this.invertedControlsTimer > 0) {
                    ctx.strokeStyle = '#ff00ff';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI*2); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#ff00ff'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
                    ctx.fillText('? ? ?', this.x, this.y - this.size - 12);
                }

                if (this.characterName === 'Blaze') {
                    if (this.solsFlameState === 'windup') {
                        const percent = 1 - (this.solsFlameTimer / this.characterData.abilities.solsFlame.windupDuration);
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.solsFlameAngle);
                        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(100, 0); ctx.stroke();
                        ctx.fillStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(Date.now()/50)*0.2})`; ctx.beginPath(); ctx.arc(50, 0, 20 + percent*50, 0, Math.PI*2); ctx.fill();
                        ctx.restore();
                    }
                    if (this.solsFlameEndlag > 0) {
                         ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI*2); ctx.stroke();
                         ctx.fillStyle = '#555'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.fillText('Endlag', this.x, this.y - this.size - 12);
                    }
                }

                if ((this.characterName === 'n7' || this.characterName === 'Super Sonic') && this.teleportState === 'windup') {
                    const percent = 1 - (this.teleportTimer / this.characterData.abilities.teleport.windupDuration);
                    const color = this.characterName === 'Super Sonic' ? '#ffd700' : '#00FFFF';
                    ctx.save(); ctx.translate(this.x, this.y); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); 
                    ctx.arc(0, 0, this.size + 10, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * percent)); ctx.stroke();
                    if (Math.random() > 0.8) ctx.globalAlpha = 0.5; ctx.restore();
                }

                // BIG GRAPPLE VISUAL
                if (this.characterName === 'Big') {
                    if (this.grappleState === 'flying') {
                        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.grappleProjectile.x, this.grappleProjectile.y); ctx.stroke();
                        ctx.fillStyle = '#ff00ff'; ctx.beginPath(); ctx.arc(this.grappleProjectile.x, this.grappleProjectile.y, 5, 0, Math.PI*2); ctx.fill();
                    } else if (this.grappleState === 'dragging' && this.grappleTarget) {
                        ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.grappleTarget.x, this.grappleTarget.y); ctx.stroke();
                    }
                    // FIX: Big Passive Visual (Ring)
                    if (this.alive && !this.downed) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(123, 104, 238, 0.5)';
                        ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI*2); ctx.stroke();
                        ctx.restore();
                    }
                }

                ctx.save(); ctx.translate(this.x, this.y);
                
                if (hasSprite) {
                    ctx.drawImage(this.sprite, -this.w/2, -this.h/2, this.w, this.h);
                } else {
                    if (this.characterName === 'TestDummy') {
                        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                        ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
                        ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 2; ctx.strokeRect(-this.w/2, -this.h/2, this.w, this.h);
                    }

                    if (this.characterName === 'Knuckles') {
                        if (this.blockState === 'blocking') {
                            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, this.size + 15, 0, Math.PI * 2); ctx.stroke();
                            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)'; ctx.fill();
                        }
                        if (this.punchState === 'windup') {
                            ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, this.size + 15, 0, Math.PI * 2); ctx.stroke();
                            const shake = Math.sin(this.punchTimer * 2) * 3; ctx.translate(shake, 0); ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; ctx.fill();
                            ctx.setTransform(1, 0, 0, 1, 0, 0); 
                        }
                        if (this.punchState === 'punching') {
                            ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, this.size + 10, 0, Math.PI * 2); ctx.stroke();
                        }
                    }

                    if (this.characterName === 'Tails') {
                        if (this.abilityStates.jump > 0) {
                            ctx.fillStyle = '#ffffff';
                            const flap = Math.sin(Date.now() / 50) * 0.3;
                            ctx.save(); ctx.translate(-this.size - 5, 0); ctx.rotate(Math.PI/4 + flap); ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
                            ctx.save(); ctx.translate(this.size + 5, 0); ctx.rotate(-Math.PI/4 - flap); ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
                        }
                        if (this.gunWindup > 0) {
                            const MAX_CHARGE = 120;
                            let chargePercent = (this.gunWindup - 1) / (MAX_CHARGE - 1);
                            if (chargePercent < 0) chargePercent = 0; if (chargePercent > 1) chargePercent = 1;
                            ctx.fillStyle = '#ffff00';
                            for(let i=0; i<3; i++) {
                                const angle = Date.now() / 50 + (i * (Math.PI * 2 / 3));
                                const dist = 15 + (chargePercent * 10);
                                const px = Math.cos(angle) * (this.size + dist);
                                const py = Math.sin(angle) * (this.size + dist);
                                ctx.beginPath(); ctx.arc(px, py, 4 + chargePercent*2, 0, Math.PI * 2); ctx.fill();
                            }
                            ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.fillText('STUN+', 0, -this.size - 15);
                        }
                    }

                    if (this.downed) {
                        ctx.fillStyle = '#aaa'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText('DOWNED', 0, -this.size - 35);
                        ctx.fillStyle = this.getCurrentColor(); ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
                        ctx.restore(); return;
                    }

                    if (this.highlightTimer > 0) {
                        ctx.fillStyle = 'rgba(255,255, 0, 0.6)'; ctx.beginPath(); ctx.arc(0, 0, this.size + 20, 0, Math.PI * 2); ctx.fill();
                    }

                    const specialSkins = ['Super', 'Enflame', 'Cosmic', 'Niggles', 'Knuckles', 'Glitch', 'Prototype', 'Super Sonic', 'Icing', 'Classic', 'Froggy']; 
                    if (specialSkins.includes(this.getCurrentSkinName())) {
                        ctx.save(); ctx.shadowColor = this.getCurrentColor(); ctx.shadowBlur = 10;
                    }

                    ctx.fillStyle = this.getCurrentColor(); ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

                    if (specialSkins.includes(this.getCurrentSkinName())) { ctx.restore(); }
                    
                    if (this.isOneBounceBoss) {
                        ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, this.size + 8, 0, Math.PI * 2); ctx.stroke();
                        ctx.fillStyle = '#ff0000'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText('BOSS', 0, -this.size - 12);
                    }
                    
                    if (this.characterName === 'Blaze' && this.firewallWindup > 0) {
                        const percent = 1 - (this.firewallWindup / this.characterData.abilities.firewall.windup);
                        ctx.strokeStyle = '#ff4500'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, this.size + 10, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * percent)); ctx.stroke();
                    }
                    if ((this.characterName === 'Sonic' || this.characterName === 'Super Sonic') && this.dashWindup > 0) {
                        const angle = Math.atan2(this.dashDirY, this.dashDirX);
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(angle)*40, Math.sin(angle)*40); ctx.stroke();
                    }
                    if (this.invincible > 0 || this.speedBoost > 0) {
                        ctx.strokeStyle = this.speedBoost > 0 ? '#00ff00' : '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2); ctx.stroke();
                    }
                    
                    if (this.characterName === 'Blaze' && this.solsFlameBuffTimer > 0) {
                        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, this.size + 8, 0, Math.PI*2); ctx.stroke();
                    }
                }
                ctx.restore();
            }
        }
        
                class Killer {
            constructor(x, y, killerType) {
                this.id = Math.random(); 
                this.x = x; this.y = y;
                this.type = killerType;
                this.isAI = true;
                this.humanControllerId = null; 
                
                this.size = 30; 
                this.w = 30; 
                this.h = 30; 
                this.moveDirX = 1; 
                this.moveDirY = 0;
                this.unstunnable = false;
                this.respawnTimer = 0; 
                this.teleportMsgTimer = 0; 
                
                this.selectedSkin = 0;
                this.particles = [];
                
                this.johnDoeSprite = new Image();
                this.johnDoeSprite.src = "sprites/5-sonic-wait2-60px.gif"; 
                
                this.maxHealth = 1000;
                this.health = this.maxHealth;
               
                this.immobilizedTimer = 0;
                this.immobilizedSource = null; 
                
                this.energy = 35; // Start with some energy
                this.maxEnergy = 100;
                this.minionDamageTracker = 0; 
                this.ability2State = 'idle'; // Dash state
                this.ability2Timer = 0;
                this.ability2Cooldown = 0;
                this.ability2DirX = 1;
                this.ability2DirY = 0;
                this.ability2Hit = false;

                if (killerType === 'Tripwire') {
                    this.speed = 8;
                    this.color = '#fcba03';
                    this.bombs = []; this.customWall = null;
                    this.grappleState = 'idle'; this.grappleTarget = null; this.grappleTimer = 0; this.grappleProjectile = {x:0, y:0};
                    this.bombCooldown = 0;
                    this.grappleCooldown = 0;
                    this.bombWindup = 0;
                    this.bombThrowState = 'idle'; 
                    this.bombThrowTarget = null;
                    this.bombThrowTimer = 0;
                    this.wallCooldown = 0; 
                    this.tripwireState = 'idle'; 
                    this.tripwireX = null; this.tripwireY = null;
                    this.tripwireCooldown = 0;
                    this.tripwireTriggeredBy = new Set();
                    this.m1Active = false; this.m1HitboxCount = 0; this.m1HitboxTimer = 0; this.m1Cooldown = 0; this.m1AttackAngle = {x:1, y:0};
                } 
                else if (killerType === '2011X') {
                    this.speed = 9; 
                    this.color = '#b30000';
                    this.rushMode = 0; 
                    this.rushCooldown = 0; 
                    this.teleportCooldown = 0;
                    this.m1State = 'idle'; this.m1Timer = 0; this.m1Cooldown = 0; 
                    this.specialCooldown = 0; 
                    this.m1AttackAngle = {x:1, y:0};
                    
                    // God's Trickery State
                    this.trickeryState = 'idle';
                    this.trickeryTimer = 0;
                    this.trickeryCooldown = 0;
                    this.trickeryAngle = 0;
                }
                else if (killerType === 'Starved') {
                    this.speed = 6.0; // Slower
                    this.color = '#8B0000'; // Red
                    this.m1State = 'idle'; this.m1Timer = 0; this.m1Cooldown = 0;
                    this.m1HitboxCount = 0; this.m1HitboxTimer = 0; this.m1Active = false;
                    this.m1AttackAngle = {x:1, y:0};
                    
                    this.ability1Cooldown = 0; // Projectile
                    this.ability3Cooldown = 0; // Minions
                    this.ability3State = 'idle';
                    this.ability3Timer = 0;
                }
                
                this.stunned = 0; this.slowness = 0;
                this.killCooldown = 0;

                // Anti Wall Stuck
                this.stuckTimer = 0;
                this.lastX = x; this.lastY = y;
            }

            // Helper to modify energy safely
            modifyEnergy(amount) {
                this.energy += amount;
                if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
                if (this.energy < 0) this.energy = 0;
            }

            getCurrentSkinName() {
                const skins = KILLER_SKINS[this.type];
                return (skins && skins[this.selectedSkin]) ? skins[this.selectedSkin].name : 'Classic';
            }
            
            findSafeSpawnPosition(obstacles) {
                let attempts = 0;
                while (attempts < 200) {
                    const x = Math.random() * (WIDTH * 0.3) + WIDTH * 0.65;
                    const y = Math.random() * (HEIGHT - 2 * this.size) + this.size;
                    if (!this.checkCollision(x, y, obstacles)) { this.x = x; this.y = y; return; }
                    attempts++;
                }
                this.x = WIDTH - 100; this.y = 300;
            }

            checkCollision(x, y, obstacles) {
                for (let obs of obstacles) {
                    if (checkCircleRectCollision(x, y, this.size, obs.x, obs.y, obs.w, obs.h)) return true;
                }
                return false;
            }

            checkWallCollision(entity, wall) {
                return (entity.x + entity.size > wall.x && entity.x - entity.size < wall.x + wall.w &&
                        entity.y + entity.size > wall.y && entity.y - entity.size < wall.y + wall.h);
            }
            
            takeDamage(amount, attacker) {
                if (this.unstunnable) return;
                this.health -= amount;
                if (this.health < 0) this.health = 0;
                this.stun(75); 
            }
            
            stun(duration) {
                if (this.unstunnable) return;
                this.stunned = duration; 
                if (this.type !== 'Tripwire') this.m1State = 'idle';
                if (this.type === 'Starved') {
                    this.m1Active = false;
                    this.ability3State = 'idle';
                    this.ability2State = 'idle'; // Cancel dash
                    this.ability2Timer = 0;
                    this.ability2Hit = false;
                }
                this.rushMode = 0; 
                this.grappleState = 'idle'; 
                this.grappleTarget = null;
                this.grappleProjectile = {x:0, y:0};
                this.bombThrowState = 'idle'; 
                
                this.immobilizedTimer = 0;
                this.immobilizedSource = null;
            }

            update(players, obstacles, inputState, customWallsRef) {
                if (this.respawnTimer > 0) {
                    this.respawnTimer--;
                    if (this.respawnTimer <= 0) {
                        this.findSafeSpawnPosition(obstacles);
                        this.stunned = 60;
                    }
                    return;
                }

                if (this.slowness > 0) this.slowness--;
                if (this.stunned > 0) { this.stunned--; return; }

                this.unstunnable = (this.rushMode > 0);

                let currentSpeed = this.speed;
                
                if (this.immobilizedTimer > 0) {
                    this.immobilizedTimer--;
                    const source = this.immobilizedSource;
                    if (source && source.alive) {
                        const angle = Math.atan2(this.y - source.y, this.x - source.x);
                        const pushForce = 1.5;
                        this.x += Math.cos(angle) * pushForce;
                        this.y += Math.sin(angle) * pushForce;
                        
                        // Anti-wall-stuck for push
                        if(this.checkCollision(this.x, this.y, obstacles)) {
                             this.x -= Math.cos(angle) * pushForce; // revert
                             this.y -= Math.sin(angle) * pushForce;
                        }
                    }
                    this.x = Math.max(this.size, Math.min(WIDTH - this.size, this.x));
                    this.y = Math.max(this.size, Math.min(HEIGHT - this.size, this.y));
                    return; 
                }

                if (this.rushMode > 0) {
                    currentSpeed *= 1.8;
                    this.rushMode--;
                } else if (this.rushCooldown > 0) this.rushCooldown--;

                if (this.slowness > 0) currentSpeed *= 0.5;

                if (this.getCurrentSkinName() === 'John Doe') {
                    if (Math.random() < 0.2) {
                         const angle = Math.random() * Math.PI * 2;
                         const dist = Math.random() * this.size;
                         this.particles.push({
                             x: this.x + Math.cos(angle) * dist, y: this.y + Math.sin(angle) * dist,
                             vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                             life: 30, maxLife: 30, color: Math.random() > 0.5 ? '#330000' : '#000000', size: Math.random() * 3 + 1
                         });
                    }
                    for (let i = this.particles.length - 1; i >= 0; i--) {
                        let p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.life--;
                        if (p.life <= 0) this.particles.splice(i, 1);
                    }
                }

                let allObstacles = [...obstacles];
                customWallsRef.forEach(w => { if (w !== this.customWall) allObstacles.push(w); });

                // --- TRIPWIRE LOGIC ---
                if (this.type === 'Tripwire') {
                    if (this.bombCooldown > 0) this.bombCooldown--;
                    if (this.grappleCooldown > 0) this.grappleCooldown--;
                    if (this.wallCooldown > 0) this.wallCooldown--;

                    if (inputState.keys.special && this.wallCooldown <= 0 && !this.customWall) {
                        this.customWall = { x: this.x - 20, y: this.y - 40, w: 40, h: 80, timer: 600 };
                        this.wallCooldown = 900;
                    }

                    if (this.customWall) {
                        this.customWall.timer--;
                        if (this.customWall.timer <= 0) this.customWall = null;
                        players.forEach(p => {
                            if (!p.alive) return;
                            if ((p.characterName === 'Sonic' && p.dashState === 'dashing') || (p.characterName === 'Super Sonic' && p.dashState === 'dashing') || (p.characterName === 'Blaze' && (p.firewallCasting || p.fireWallUses === 0))) {
                                if (this.checkWallCollision(p, this.customWall)) this.customWall = null;
                            }
                        });
                    }

                    const nearbyBomb = this.bombs.find(b => Math.hypot(b.x - this.x, b.y - this.y) < 60);

                    if (this.bombThrowState === 'aiming') {
                        this.bombThrowTimer = (this.bombThrowTimer || 0) + 1;
                        let throwTarget = null; let minD = Infinity;
                        players.forEach(p => { if(p.alive) { const d = Math.hypot(p.x - this.x, p.y - this.y); if(d < minD) { minD = d; throwTarget = p; }}});
                        
                        if (!inputState.keys.rush || this.bombThrowTimer > 60) {
                            if (throwTarget && this.bombs.length > 0) {
                                const dist = Math.hypot(throwTarget.x - this.x, throwTarget.y - this.y);
                                if (dist <= 200) {
                                    const bomb = this.bombs[this.bombs.length - 1];
                                    bomb.thrown = true;
                                    bomb.throwVX = (throwTarget.x - bomb.x) / dist * 14;
                                    bomb.throwVY = (throwTarget.y - bomb.y) / dist * 14;
                                }
                            }
                            this.bombThrowState = 'idle';
                            this.bombThrowTimer = 0;
                        }
                    } else if (this.bombWindup > 0) {
                        this.bombWindup--;
                        currentSpeed *= 0.5;
                        if (this.bombWindup === 0) {
                            if (this.bombs.length < 7 && !nearbyBomb) {
                                this.bombs.push({x: this.x, y: this.y, triggered: false, triggerTimer: 12, thrown: false, throwVX: 0, throwVY: 0});
                            }
                            this.bombCooldown = 120;
                        }
                    } else if (inputState.keys.rush && this.bombCooldown <= 0 && this.bombs.length < 7) {
                        if (this.grappleState === 'idle' && this.bombs.length > 0) {
                            this.bombThrowState = 'aiming';
                            this.bombThrowTimer = 0;
                        } else {
                            this.bombWindup = 12;
                        }
                    }

                    for (let i = this.bombs.length - 1; i >= 0; i--) {
                        const b = this.bombs[i];
                        if (b.thrown) {
                            b.x += b.throwVX; b.y += b.throwVY;
                            let hitWall = false;
                            for (let obs of allObstacles) { if (checkCircleRectCollision(b.x, b.y, 10, obs.x, obs.y, obs.w, obs.h)) { hitWall = true; break; } }
                            if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) hitWall = true;
                            let hitPlayer = false;
                            players.forEach(p => {
                                if (!p.alive) return;
                                if (Math.hypot(p.x - b.x, p.y - b.y) < p.size + 10) {
                                    p.takeDamage(20, this);
                                    hitPlayer = true;
                                }
                            });
                            if (hitWall || hitPlayer) {
                                    gameParticles.push(new Explosion(b.x, b.y, '#fcba03'));
                                    players.forEach(p => {
                                    if (!p.alive) return;
                                    if (Math.hypot(p.x - b.x, p.y - b.y) < 70) p.takeDamage(15, this);
                                });
                                this.bombs.splice(i, 1);
                                continue;
                            }
                        } else {
                            players.forEach(p => {
                                if (p.alive && !p.downed) {
                                    const dist = Math.hypot(p.x - b.x, p.y - b.y);
                                    if (dist < 60) {
                                        gameParticles.push(new Explosion(b.x, b.y, '#fcba03'));
                                        players.forEach(victim => {
                                            if (!victim.alive) return;
                                            if (Math.hypot(victim.x - b.x, victim.y - b.y) < 70) victim.takeDamage(15, this);
                                        });
                                        this.bombs.splice(i, 1);
                                        return;
                                    }
                                }
                            });
                        }
                    }

                    let target = null; let minDist = Infinity;
                    players.forEach(p => { if(p.alive) { const d = Math.hypot(p.x - this.x, p.y - this.y); if(d < minDist) { minDist = d; target = p; } }});

                    if (this.grappleState === 'idle' && inputState.keys.teleport && this.grappleCooldown <= 0 && target) {
                        const grappleRange = 300; 
                        if (Math.hypot(target.x - this.x, target.y - this.y) <= grappleRange) {
                            this.grappleState = 'flying';
                            this.grappleTarget = target;
                            this.grappleCooldown = 99999;
                            this.grappleProjectile = {x: this.x, y: this.y};
                            this.grappleTimer = 12; 
                        }
                    }
                    
                    if (this.grappleState === 'flying') {
                        if (!this.grappleTarget || !this.grappleTarget.alive) {
                            this.grappleState = 'idle'; this.grappleCooldown = 480; return;
                        }
                        const dx = this.grappleTarget.x - this.grappleProjectile.x;
                        const dy = this.grappleTarget.y - this.grappleProjectile.y;
                        const dist = Math.hypot(dx, dy);
                        const grappleSpeed = 50; 
                        let hitWall = false;
                        for (let obs of allObstacles) {
                            if (checkCircleRectCollision(this.grappleProjectile.x, this.grappleProjectile.y, 5, obs.x, obs.y, obs.w, obs.h)) { hitWall = true; break; }
                        }
                        if (hitWall) {
                            this.grappleState = 'idle'; this.grappleCooldown = 420;
                        } 
                        else if (dist < grappleSpeed + 20 || this.grappleTimer <= 0) {
                            if (this.grappleTarget) {
                                if (this.grappleTarget.downed) { this.grappleTarget.alive = false; } 
                                else { this.grappleTarget.takeDamage(0, this); }
                            }
                            this.grappleState = 'dragging'; this.grappleTimer = 20; this.grappleCooldown = 420; 
                        } else {
                            this.grappleProjectile.x += (dx / dist) * grappleSpeed;
                            this.grappleProjectile.y += (dy / dist) * grappleSpeed;
                            this.grappleTimer--;
                        }
                    }
                    
                    if (this.grappleState === 'dragging') {
                        if (!this.grappleTarget || !this.grappleTarget.alive || this.stunned > 0) {
                            this.grappleState = 'idle';
                        } else {
                            const dx = this.x - this.grappleTarget.x;
                            const dy = this.y - this.grappleTarget.y;
                            const dist = Math.hypot(dx, dy);
                            const dragSpeed = this.grappleTarget.speed * 5;
                            
                            if (dist > 5) {
                                const nextX = this.grappleTarget.x + (dx / dist) * dragSpeed;
                                const nextY = this.grappleTarget.y + (dy / dist) * dragSpeed;
                                let wallHit = false;
                                for(let obs of allObstacles) {
                                    if(checkCircleRectCollision(nextX, nextY, this.grappleTarget.size, obs.x, obs.y, obs.w, obs.h)) { wallHit = true; break; }
                                }
                                if(wallHit) {
                                    this.grappleState = 'idle'; this.grappleTarget = null;
                                } else {
                                    this.grappleTarget.x = nextX; this.grappleTarget.y = nextY;
                                    this.grappleTimer--;
                                    if (this.grappleTimer <= 0) this.grappleState = 'idle';
                                }
                            } else { this.grappleState = 'idle'; }
                        }
                    }

                    // M1 Logic
                    if (!this.m1Active && inputState.m1Clicked && (this.m1Cooldown || 0) <= 0) {
                        this.m1Active = true;
                        this.m1HitboxCount = 0;
                        this.m1HitboxTimer = 0;
                        this.m1Cooldown = 60; 
                        if (target) {
                            const ang = Math.atan2(target.y - this.y, target.x - this.x);
                            this.m1AttackAngle = { x: Math.cos(ang), y: Math.sin(ang) };
                        } else {
                            this.m1AttackAngle = { x: this.moveDirX || 1, y: this.moveDirY || 0 };
                        }
                    }
                    if (this.m1Active) {
                        this.m1HitboxTimer = (this.m1HitboxTimer || 0) + 1;
                        if (this.m1HitboxTimer % 2 === 1 && this.m1HitboxCount < 6) {
                            const normX = this.m1AttackAngle.x;
                            const normY = this.m1AttackAngle.y;
                            spawnHitbox(this.x + normX * 45, this.y + normY * 45, 30, 8, this, 'killer_m1', 4);
                            this.m1HitboxCount++;
                        }
                        if (this.m1HitboxCount >= 6) {
                            this.m1Active = false;
                            this.m1HitboxCount = 0;
                            this.m1HitboxTimer = 0;
                        }
                    }
                    if (this.m1Cooldown > 0) this.m1Cooldown--;

                    let targetVx = 0, targetVy = 0;
                    if (inputState.keys.up) targetVy = -currentSpeed; if (inputState.keys.down) targetVy = currentSpeed;
                    if (inputState.keys.left) targetVx = -currentSpeed; if (inputState.keys.right) targetVx = currentSpeed;
                    if (targetVx !== 0 || targetVy !== 0) {
                        this.moveDirX = targetVx; this.moveDirY = targetVy;
                        const len = Math.hypot(this.moveDirX, this.moveDirY);
                        this.moveDirX /= len; this.moveDirY /= len;
                    }
                    if (targetVx !== 0 && targetVy !== 0) { targetVx *= 0.707; targetVy *= 0.707; }
                    
                    // Check Collision with Big
                    let canMoveX = true, canMoveY = true;
                    players.forEach(p => {
                        if(p.alive && !p.escaped && !p.downed && p.characterName === 'Big') {
                            let nextX = this.x + targetVx;
                            let nextY = this.y + targetVy;
                            // Check X
                            if(checkCircleRectCollision(nextX, this.y, this.size, p.x - p.size, p.y - p.size, p.size*2, p.size*2)) canMoveX = false;
                            // Check Y
                            if(checkCircleRectCollision(this.x, nextY, this.size, p.x - p.size, p.y - p.size, p.size*2, p.size*2)) canMoveY = false;
                        }
                    });

                    if(canMoveX && targetVx !== 0) { let nextX = this.x + targetVx; if(!this.checkCollision(nextX, this.y, allObstacles)) this.x = nextX; }
                    if(canMoveY && targetVy !== 0) { let nextY = this.y + targetVy; if(!this.checkCollision(this.x, nextY, allObstacles)) this.y = nextY; }
                    this.x = Math.max(this.w/2, Math.min(WIDTH - this.w/2, this.x));
                    this.y = Math.max(this.h/2, Math.min(HEIGHT - this.h/2, this.y));
                } 
                else if (this.type === '2011X') {
                    if (this.teleportCooldown > 0) this.teleportCooldown--;
                    if (this.m1Cooldown > 0) this.m1Cooldown--;
                    if (this.rushCooldown > 0) this.rushCooldown--;
                    if (this.trickeryCooldown > 0) this.trickeryCooldown--;

                    let target = null; let minDist = Infinity;
                    players.forEach(p => { if(p.alive) { const d = Math.hypot(p.x - this.x, p.y - this.y); if(d < minDist) { minDist = d; target = p; } }});

                    if (this.m1State !== 'idle') {
                        this.m1Timer--;
                        if (this.m1State === 'windup') { 
                            if (this.m1Timer <= 0) { 
                                this.m1State = 'attacking'; this.m1Timer = 12; 
                            } 
                        } else if (this.m1State === 'attacking') {
                            if (this.m1Timer % 2 === 0 && this.m1HitboxCount < 6) {
                                const normAngleX = this.m1AttackAngle.x / Math.hypot(this.m1AttackAngle.x, this.m1AttackAngle.y) || 0;
                                const normAngleY = this.m1AttackAngle.y / Math.hypot(this.m1AttackAngle.x, this.m1AttackAngle.y) || 0;
                                const offset = 40;
                                const hx = this.x + normAngleX * offset;
                                const hy = this.y + normAngleY * offset;
                                spawnHitbox(hx, hy, 30, 10, this, 'killer_m1_2011x', 5, {applyBleed: true});
                                this.m1HitboxCount++;
                            }
                            if (this.m1Timer <= 0 || this.m1HitboxCount >= 6) { 
                                this.m1State = 'idle'; 
                                this.m1Cooldown = 30; 
                                this.m1HitboxCount = 0;
                            } 
                        }
                    }

                    // God's Trickery
                    if (this.trickeryState === 'idle' && inputState.keys.special && this.trickeryCooldown <= 0) {
                        this.trickeryState = 'windup';
                        this.trickeryTimer = 15; 
                        if (target) {
                            this.trickeryAngle = Math.atan2(target.y - this.y, target.x - this.x);
                        } else {
                            this.trickeryAngle = Math.atan2(this.moveDirY, this.moveDirX);
                        }
                    } else if (this.trickeryState === 'windup') {
                        this.trickeryTimer--;
                        currentSpeed *= 0.1; 
                        if (this.trickeryTimer <= 0) {
                            this.trickeryState = 'active';
                            this.trickeryTimer = 30; 
                            this.trickeryCooldown = 900; 
                            
                            const range = 150;
                            const hx = this.x + Math.cos(this.trickeryAngle) * (range/2);
                            const hy = this.y + Math.sin(this.trickeryAngle) * (range/2);
                            spawnHitbox(hx, hy, range/2, 15, this, 'gods_trickery', 0, {angle: this.trickeryAngle, range: range});
                        }
                    } else if (this.trickeryState === 'active') {
                        this.trickeryTimer--;
                        if (this.trickeryTimer <= 0) this.trickeryState = 'idle';
                    }

                    let targetVx = 0, targetVy = 0;
                    if (!this.isAI || this.humanControllerId) {
                        if (inputState.m1Clicked && this.m1State === 'idle' && this.m1Cooldown <= 0) { 
                            this.m1State = 'windup'; this.m1Timer = 12; this.m1HitboxCount = 0;
                            if (target) {
                                const ang = Math.atan2(target.y - this.y, target.x - this.x);
                                this.m1AttackAngle = { x: Math.cos(ang), y: Math.sin(ang) };
                            } else {
                                this.m1AttackAngle = {x: this.moveDirX || 1, y: this.moveDirY || 0};
                            }
                        }
                        if (inputState.keys.rush && this.rushCooldown <= 0) { 
                             this.rushMode = 180; 
                             this.rushCooldown = 540; 
                             this.unstunnable = true; 
                        }
                        if (inputState.keys.teleport && this.teleportCooldown <= 0) {
                            this.teleportCooldown = 900; this.stunned = 24; 
                            this.teleportMsgTimer = 30; 
                            if (target) {
                                let attempts = 0;
                                let found = false;
                                while(attempts < 20) {
                                    let angle = Math.random() * Math.PI * 2;
                                    let tx = target.x + Math.cos(angle) * 80;
                                    let ty = target.y + Math.sin(angle) * 80;
                                    tx = Math.max(this.size, Math.min(WIDTH - this.size, tx));
                                    ty = Math.max(this.size, Math.min(HEIGHT - this.size, ty));
                                    if(!this.checkCollision(tx, ty, allObstacles)) {
                                        this.x = tx; this.y = ty; found = true; break;
                                    }
                                    attempts++;
                                }
                                if (found) {
                                    players.forEach(p => {
                                        if (p.alive && Math.hypot(p.x - this.x, p.y - this.y) < 200) {
                                            if (p.bleedTimer <= 0) p.bleedTimer = 180;
                                        }
                                    });
                                }
                            }
                        }
                        if (inputState.keys.up) targetVy = -currentSpeed; if (inputState.keys.down) targetVy = currentSpeed;
                        if (inputState.keys.left) targetVx = -currentSpeed; if (inputState.keys.right) targetVx = currentSpeed;
                    } else {
                        if (target) {
                            const dist = Math.hypot(target.x - this.x, target.y - this.y);
                            if (dist < 60 && this.m1Cooldown <= 0) { 
                                this.m1State = 'windup'; this.m1Timer = 12; this.m1HitboxCount = 0;
                                const ang = Math.atan2(target.y - this.y, target.x - this.x);
                                this.m1AttackAngle = { x: Math.cos(ang), y: Math.sin(ang) };
                            }
                            if (dist > 0) { targetVx = (target.x - this.x) / dist * currentSpeed; targetVy = (target.y - this.y) / dist * currentSpeed; }
                            if (dist > 300 && this.teleportCooldown <= 0 && Math.random() < 0.01) {
                                inputState.keys.teleport = true; 
                            }
                        }
                    }
                    
                    if (targetVx !== 0 || targetVy !== 0) {
                        this.moveDirX = targetVx; this.moveDirY = targetVy;
                        const len = Math.hypot(this.moveDirX, this.moveDirY);
                        this.moveDirX /= len; this.moveDirY /= len;
                    }
                    if (targetVx !== 0 && targetVy !== 0) { targetVx *= 0.707; targetVy *= 0.707; }
                    
                    // Big Collision for 2011X
                    let canMoveX = true, canMoveY = true;
                    players.forEach(p => {
                        if(p.alive && !p.escaped && !p.downed && p.characterName === 'Big') {
                            let nextX = this.x + targetVx;
                            let nextY = this.y + targetVy;
                            if(checkCircleRectCollision(nextX, this.y, this.size, p.x - p.size, p.y - p.size, p.size*2, p.size*2)) canMoveX = false;
                            if(checkCircleRectCollision(this.x, nextY, this.size, p.x - p.size, p.y - p.size, p.size*2, p.size*2)) canMoveY = false;
                        }
                    });

                    if(canMoveX && targetVx !== 0) { let nextX = this.x + targetVx; if(!this.checkCollision(nextX, this.y, allObstacles)) this.x = nextX; }
                    if(canMoveY && targetVy !== 0) { let nextY = this.y + targetVy; if(!this.checkCollision(this.x, nextY, allObstacles)) this.y = nextY; }
                    this.x = Math.max(this.w/2, Math.min(WIDTH - this.w/2, this.x));
                    this.y = Math.max(this.h/2, Math.min(HEIGHT - this.h/2, this.y));
                }
                // STARVED OVERHAUL
                else if (this.type === 'Starved') {
                    if (this.m1Cooldown > 0) this.m1Cooldown--;
                    if (this.ability1Cooldown > 0) this.ability1Cooldown--;
                    if (this.ability2Cooldown > 0) this.ability2Cooldown--;
                    if (this.ability3Cooldown > 0) this.ability3Cooldown--;

                    let target = null; let minDist = Infinity;
                    players.forEach(p => { if(p.alive) { const d = Math.hypot(p.x - this.x, p.y - this.y); if(d < minDist) { minDist = d; target = p; } }});
                    // Cost 10E, 4s CD, Shoots at player, 4 Dmg, 0.2s Stun
                    if (inputState.keys.ability1 && this.ability1Cooldown <= 0 && this.energy >= 10 && target) {
                        this.modifyEnergy(-10);
                        this.ability1Cooldown = 240; // 4s
                        // Use StarvedBullet class
                        projectiles.push(new StarvedBullet(this.x, this.y, target, this, 15, 4, 12)); 
                    }

                    // Dash forward. Hit = Stun + Energy. Miss = Slowness.
                    if (this.ability2State === 'idle' && inputState.keys.ability2 && this.ability2Cooldown <= 0) {
                        // Determine direction
                        let dirX = 1, dirY = 0;
                        if (inputState.keys.up) dirY = -1;
                        if (inputState.keys.down) dirY = 1;
                        if (inputState.keys.left) dirX = -1;
                        if (inputState.keys.right) dirX = 1;
                        if (dirX===0 && dirY===0) { dirX = 1; dirY = 0; }
                        else { const l = Math.hypot(dirX, dirY); dirX/=l; dirY/=l; }

                        this.ability2State = 'dashing';
                        this.ability2Timer = 15; // Dash duration
                        this.ability2DirX = dirX;
                        this.ability2DirY = dirY;
                        this.ability2Cooldown = 600; // 10s
                        this.invincible = 15;
                        this.ability2Hit = false;
                    } else if (this.ability2State === 'dashing') {
                        this.ability2Timer--;
                        
                        // Move
                        // FIX: Direct speed of 14, no multiplication by 0.15
                        this.x += this.ability2DirX * 14;
                        this.y += this.ability2DirY * 14;

                        // Hitbox
                        const hx = this.x + this.ability2DirX * 20;
                        const hy = this.y + this.ability2DirY * 20;
                        spawnHitbox(hx, hy, 35, 3, this, 'starved_dash', 10, {vx: this.ability2DirX, vy: this.ability2DirY});
                        
                        if (this.ability2Timer <= 0) {
                            this.ability2State = 'idle';
                            if (!this.ability2Hit) {
                                this.slowness = 120; // Miss penalty
                            }
                        }
                    }

                    if (this.ability3State === 'idle' && inputState.keys.ability3 && this.ability3Cooldown <= 0) {
                        this.ability3State = 'windup';
                        this.ability3Timer = 120; 
                    } else if (this.ability3State === 'windup') {
                        this.ability3Timer--;
                        currentSpeed *= 0.1;
                        if (this.ability3Timer <= 0) {
                            this.ability3State = 'idle';
                            this.ability3Cooldown = 1200; 
                            minions.push(new Minion(this.x - 30, this.y, 'aggressive', this));
                            minions.push(new Minion(this.x + 30, this.y, 'shooter', this));
                        }
                    }

                    if (this.m1Active) {
                        this.m1HitboxTimer++;
                        if (this.m1HitboxTimer % 2 === 1 && this.m1HitboxCount < 6) {
                            const normX = this.m1AttackAngle.x; 
                            const normY = this.m1AttackAngle.y;
                            spawnHitbox(this.x + normX * 45, this.y + normY * 45, 30, 8, this, 'starved_m1', 3); 
                            this.m1HitboxCount++;
                        }
                        if (this.m1HitboxCount >= 6) {
                            this.m1Active = false; this.m1HitboxCount = 0; this.m1HitboxTimer = 0;
                        }
                    }
                    if (this.m1Cooldown > 0) this.m1Cooldown--;

                    let targetVx = 0, targetVy = 0;
                    if (!this.isAI || this.humanControllerId) {
                        if (inputState.m1Clicked && !this.m1Active && this.m1Cooldown <= 0) {
                            this.m1Active = true; this.m1HitboxCount = 0; this.m1HitboxTimer = 0; this.m1Cooldown = 60;
                            if (target) {
                                const ang = Math.atan2(target.y - this.y, target.x - this.x);
                                this.m1AttackAngle = { x: Math.cos(ang), y: Math.sin(ang) };
                            } else {
                                this.m1AttackAngle = {x: this.moveDirX || 1, y: this.moveDirY || 0};
                            }
                        }
                        if (inputState.keys.up) targetVy = -currentSpeed; if (inputState.keys.down) targetVy = currentSpeed;
                        if (inputState.keys.left) targetVx = -currentSpeed; if (inputState.keys.right) targetVx = currentSpeed;
                    } else {
                        if (target) {
                            const dist = Math.hypot(target.x - this.x, target.y - this.y);
                            if (dist < 60 && this.m1Cooldown <= 0) { 
                                this.m1Active = true; this.m1HitboxCount = 0; this.m1HitboxTimer = 0; this.m1Cooldown = 60;
                                const ang = Math.atan2(target.y - this.y, target.x - this.x);
                                this.m1AttackAngle = { x: Math.cos(ang), y: Math.sin(ang) };
                            }
                            if (dist > 0) { targetVx = (target.x - this.x) / dist * currentSpeed; targetVy = (target.y - this.y) / dist * currentSpeed; }
                            if (dist > 200 && this.ability1Cooldown <= 0 && this.energy >= 10) {
                                inputState.keys.ability1 = true; 
                            }
                        }
                    }
                    if (targetVx !== 0 || targetVy !== 0) {
                        this.moveDirX = targetVx; this.moveDirY = targetVy;
                        const len = Math.hypot(this.moveDirX, this.moveDirY);
                        this.moveDirX /= len; this.moveDirY /= len;
                    }
                    if (targetVx !== 0 && targetVy !== 0) { targetVx *= 0.707; targetVy *= 0.707; }
                    
                    // Big Collision for Starved
                    let canMoveX = true, canMoveY = true;
                    players.forEach(p => {
                        if(p.alive && !p.escaped && !p.downed && p.characterName === 'Big') {
                            let nextX = this.x + targetVx;
                            let nextY = this.y + targetVy;
                            if(checkCircleRectCollision(nextX, this.y, this.size, p.x - p.size, p.y - p.size, p.size*2, p.size*2)) canMoveX = false;
                            if(checkCircleRectCollision(this.x, nextY, this.size, p.x - p.size, p.y - p.size, p.size*2, p.size*2)) canMoveY = false;
                        }
                    });

                    if(canMoveX && targetVx !== 0) { let nextX = this.x + targetVx; if(!this.checkCollision(nextX, this.y, allObstacles)) this.x = nextX; }
                    if(canMoveY && targetVy !== 0) { let nextY = this.y + targetVy; if(!this.checkCollision(this.x, nextY, allObstacles)) this.y = nextY; }
                    this.x = Math.max(this.w/2, Math.min(WIDTH - this.w/2, this.x));
                    this.y = Math.max(this.h/2, Math.min(HEIGHT - this.h/2, this.y));
                }
                
                // Anti Wall Stuck Logic
                const distMoved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
                if (distMoved < 0.1 && this.stunned <= 0 && this.immobilizedTimer <= 0 && this.ability3State !== 'windup') {
                    this.stuckTimer++;
                } else {
                    this.stuckTimer = 0;
                }
                this.lastX = this.x; this.lastY = this.y;
                if (this.stuckTimer > 300) {
                    this.findSafeSpawnPosition(obstacles);
                    this.stuckTimer = 0;
                    this.stunned = 30;
                }

                if (this.teleportMsgTimer > 0) this.teleportMsgTimer--;
            }
        
            draw() {
                if (this.respawnTimer > 0) return; 
                if (this.immobilizedTimer > 0) {
                    ctx.save(); ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 15, 0, Math.PI*2); ctx.stroke();
                    ctx.fillStyle = '#ff00ff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('Pushed', this.x, this.y - this.size - 20); ctx.restore();
                }
                if (this.teleportMsgTimer > 0) {
                    ctx.save(); ctx.fillStyle = '#fff'; ctx.font = 'bold 40px "Courier New"'; ctx.textAlign = 'center';
                    ctx.shadowColor = 'red'; ctx.shadowBlur = 10; ctx.fillText("I see you", WIDTH/2, HEIGHT/2); ctx.restore();
                }

                if (this.type === 'Tripwire') {
                    if (this.bombWindup > 0) {
                        ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2; const percent = 1 - (this.bombWindup / 12);
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 15, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * percent)); ctx.stroke();
                    }
                    ctx.fillStyle = this.stunned > 0 ? '#888' : '#fcba03';
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
                    this.bombs.forEach(b => {
                        const particleCount = 10; const orbitRadius = 30; const spinSpeed = 0.003; const timeOffset = Date.now() * spinSpeed;
                        for(let i=0; i<particleCount; i++) {
                            const angle = timeOffset + (i * (Math.PI * 2 / particleCount));
                            const px = b.x + Math.cos(angle) * orbitRadius; const py = b.y + Math.sin(angle) * orbitRadius;
                            ctx.fillStyle = '#fcba03'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1; ctx.stroke();
                        }
                        ctx.fillStyle = '#5c4d00'; ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, Math.PI*2); ctx.fill();
                        if (b.triggered) { ctx.strokeStyle = `rgba(255, 0, 0, ${b.triggerTimer/12})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, 60, 0, Math.PI*2); ctx.stroke(); }
                    });
                    if (this.customWall) {
                        ctx.fillStyle = 'rgba(252, 186, 3, 0.6)'; ctx.fillRect(this.customWall.x, this.customWall.y, this.customWall.w, this.customWall.h);
                        ctx.strokeStyle = '#fcba03'; ctx.lineWidth = 3; ctx.strokeRect(this.customWall.x, this.customWall.y, this.customWall.w, this.customWall.h);
                    }
                    if (this.grappleState === 'flying') {
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.grappleProjectile.x, this.grappleProjectile.y); ctx.stroke();
                        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.grappleProjectile.x, this.grappleProjectile.y, 5, 0, Math.PI*2); ctx.fill();
                    } else if (this.grappleState === 'dragging' && this.grappleTarget) {
                        ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.grappleTarget.x, this.grappleTarget.y); ctx.stroke();
                    }
                    if (this.bombThrowState === 'aiming') {
                        ctx.strokeStyle = '#ff9900'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]); ctx.beginPath(); ctx.arc(this.x, this.y, 200, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                        ctx.fillStyle = '#ff9900'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('AIM BOMB', this.x, this.y - this.size - 18);
                    }
                } 
                else if (this.type === '2011X') {
                    if (this.stunned > 0) {
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 10, (Date.now() / 50) % 6, (Date.now() / 50) % 6 + Math.PI); ctx.stroke();
                    }
                    if (this.rushMode > 0) { 
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 20, 0, Math.PI * 2); ctx.fill(); 
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
                    }
                    if (this.trickeryState === 'windup') {
                        const percent = 1 - (this.trickeryTimer / 30);
                        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 4;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 15, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * percent)); ctx.stroke();
                        ctx.fillStyle = '#ff00ff'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText('TRICKERY', this.x, this.y - this.size - 20);
                    }
                    if (this.teleportCooldown > 880) { ctx.fillStyle = 'rgba(255, 0, 255, 0.3)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 25, 0, Math.PI * 2); ctx.fill(); }
                    ctx.fillStyle = this.m1State === 'windup' ? '#ffff00' : (this.stunned > 0 ? '#888' : '#b30000');
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
                    if (this.m1State !== 'idle' || this.m1Active) {
                        let dirX = this.moveDirX; let dirY = this.moveDirY;
                        if (this.m1AttackAngle) { dirX = this.m1AttackAngle.x; dirY = this.m1AttackAngle.y; }
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + dirX * (this.size + 30), this.y + dirY * (this.size + 30)); ctx.stroke();
                    }
                    if (this.stunned <= 0) {
                        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.x - 10, this.y - 5, 5, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(this.x + 10, this.y - 5, 5, 0, Math.PI * 2); ctx.fill();
                    } else {
                        ctx.fillStyle = '#fff'; ctx.font = '20px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('✦', this.x - 10, this.y - 5); ctx.fillText('✦', this.x + 10, this.y - 5);
                    }
                }
                else if (this.type === 'Starved') {
                    if (this.stunned > 0) {
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 10, (Date.now() / 50) % 6, (Date.now() / 50) % 6 + Math.PI); ctx.stroke();
                    }
                    ctx.fillStyle = this.stunned > 0 ? '#555' : this.color; // Red
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
                    
                    // Eyes
                    if (this.stunned <= 0) {
                        ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(this.x - 8, this.y - 5, 4, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(this.x + 8, this.y - 5, 4, 0, Math.PI * 2); ctx.fill();
                    }
                    
                    // Energy Bar
                    const barW = 60; const barH = 5;
                    ctx.fillStyle = '#333'; ctx.fillRect(this.x - barW/2, this.y + this.size + 10, barW, barH);
                    ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - barW/2, this.y + this.size + 10, barW * (this.energy / this.maxEnergy), barH);
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(this.x - barW/2, this.y + this.size + 10, barW, barH);

                    // Ability 3 Windup
                    if (this.ability3State === 'windup') {
                        const percent = 1 - (this.ability3Timer / 120);
                        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 4;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 20, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * percent)); ctx.stroke();
                    }
                    
                    // Dash Visual
                    if (this.ability2State === 'dashing') {
                         ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; 
                         ctx.beginPath(); ctx.arc(this.x, this.y, this.size + 15, 0, Math.PI*2); ctx.fill();
                    }
                }
            }
        } 

        const keys = {};
        window.addEventListener('keydown', (e) => { 
            // FIX: Dev Mode toggle to F12
            if (e.key === 'F12') { devMode = !devMode; }
            if (e.key === 'Escape') {
                if (gameState === PLAYING) { gameState = PAUSED; Object.values(audioEls).forEach(a => a.pause()); } 
                else if (gameState === PAUSED) {
                    gameState = PLAYING;
                    try { if (gameSetup.isOneBounce) audioEls.oneBounce.play().catch(()=>{}); else if (gameSetup.selectedKillerType === 'Tripwire') audioEls.tripwire.play().catch(()=>{}); else if (gameSetup.selectedKillerType === '2011X') audioEls.x2011.play().catch(()=>{}); else if (gameSetup.selectedKillerType === 'Starved') audioEls.starved.play().catch(()=>{}); } catch(err) {}
                }
                e.preventDefault(); return;
            }
            if (waitingForKey && gameState === SETTINGS) {
                if (e.key === 'Escape') { waitingForKey = false; settingsPlayer = null; settingsControl = null; } 
                else {
                    let key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
                    if (key === 'control') key = 'Control';
                    controlSchemes[settingsPlayer][settingsControl] = key; waitingForKey = false; settingsPlayer = null; settingsControl = null; saveStorage(); 
                }
                e.preventDefault();
            } else keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
        
        let mouseX = 0, mouseY = 0, mouseClicked = false; let mouseDown = false;
        canvas.addEventListener('mousemove', (e) => { 
            const rect = canvas.getBoundingClientRect(); 
            mouseX = e.clientX - rect.left; 
            mouseY = e.clientY - rect.top; 
            // FIX: Handle volume drag
            if (isDraggingVolume) handleSettingsClick(); 
        });
        canvas.addEventListener('mousedown', () => { mouseClicked = true; mouseDown = true; if(gameState === SETTINGS) handleSettingsClick(); });
        window.addEventListener('mouseup', () => { mouseDown = false; isDraggingVolume = false; });
        
        let gameState = MENU; let players = []; let killers = []; let obstacles = []; let gameTimer = 0;
        let oneBounceTimer = 0; let escapeTimer = 0; let gameOverMessage = ""; let isEscapePhase = false; let wasLoneSurvivorTriggered = false;
        
        let gameSetup = {
            survivorCount: 1, selectedCharacters: [], selectedSkins: {}, selectedKillerType: 'Tripwire', selectedKillerMode: 'Player', selectedMap: 'Open Field', gameMode: 'solo', isOneBounce: false, selectedKillerSkin: 0
        };
        let settingsPlayer = null, settingsControl = null, waitingForKey = false;

        class Button {
            constructor(x, y, width, height, text, color, hoverColor) {
                this.x = x; this.y = y; this.width = width; this.height = height; this.text = text; this.color = color; this.hoverColor = hoverColor;
            }
            isHovered() { return mouseX >= this.x && mouseX <= this.x + this.width && mouseY >= this.y && mouseY <= this.y + this.height; }
            draw() {
                const hovered = this.isHovered();
                ctx.fillStyle = hovered ? this.hoverColor : this.color; ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#fff'; let fontSize = Math.floor(this.width < 100 ? 16 : 20); ctx.font = `${fontSize}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                while (ctx.measureText(this.text).width > this.width - 10 && fontSize > 8) { fontSize--; ctx.font = `${fontSize}px Arial`; }
                ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
            }
        }

        function playMenuMusic() {
            try { [audioEls.tripwire, audioEls.x2011, audioEls.lms, audioEls.oneBounce, audioEls.doe, audioEls.lmsSonic, audioEls.lmsTails, audioEls.lmsKnuckles, audioEls.lmsBlaze, audioEls.lmsCream, audioEls.charlieLms, audioEls.starved].forEach(a => { a.pause(); a.volume = 0; }); if (audioEls.menu.paused) audioEls.menu.play().catch(e => {}); audioEls.menu.volume = globalMusicVolume; } catch(e) {}
        }
        function stopAllMusic(resetTime = false) { try { Object.values(audioEls).forEach(track => { track.pause(); track.volume = 0; if (resetTime) track.currentTime = 0; }); } catch(e) {} }


        function drawMenu() {
            playMenuMusic();
            const gradient = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, 50, WIDTH/2, HEIGHT/2, 800);
            gradient.addColorStop(0, '#4a0000'); gradient.addColorStop(1, '#000000'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10; 
            // FIX: Title Update
            ctx.fillStyle = '#ff4444'; ctx.font = 'bold 60px Courier New'; ctx.textAlign = 'left'; ctx.fillText('Outcome Memories 2D', 50, 100);
            ctx.fillStyle = '#888'; ctx.font = '20px Arial'; ctx.fillText('Update: Starved Rework + Big Character', 50, 130); ctx.shadowBlur = 0;
            const btnX = WIDTH - 280; const startY = 150; const btnHeight = 70; const gap = 20;
            const playBtn = new Button(btnX, startY, 250, btnHeight, 'PLAY', '#00d9ff', '#00b8d4');
            const settingsBtn = new Button(btnX, startY + btnHeight + gap, 250, btnHeight, 'SETTINGS', '#ff9800', '#e68900');
            const abilitiesBtn = new Button(btnX, startY + (btnHeight + gap) * 2, 250, btnHeight, 'ABILITIES', '#4caf50', '#388e3c');
            const creditsBtn = new Button(btnX, startY + (btnHeight + gap) * 3, 250, btnHeight, 'CREDITS', '#2196f3', '#1976d2');
            playBtn.draw(); settingsBtn.draw(); abilitiesBtn.draw(); creditsBtn.draw();
            const devBtn = new Button(WIDTH - 150, HEIGHT - 60, 120, 40, devMode ? "DEV: ON" : "DEV: (F12) OFF", devMode ? "#00ff00" : "#333", devMode ? "#00cc00" : "#555"); devBtn.draw();
            if (mouseClicked) {
                if (playBtn.isHovered()) gameState = GAME_SETUP;
                if (settingsBtn.isHovered()) gameState = SETTINGS;
                if (abilitiesBtn.isHovered()) gameState = ABOUT_ABILITIES;
                if (creditsBtn.isHovered()) gameState = ABOUT_CREDITS;
                if (devBtn.isHovered()) devMode = !devMode;
            }
            ctx.fillStyle = '#aaa'; ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.fillText('Update: Starved Rework + Big Character', WIDTH/2, HEIGHT - 20);
        }

        function drawSettings() {
            playMenuMusic();
            ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.shadowColor = '#0f3460'; ctx.shadowBlur = 5; ctx.fillStyle = '#e94560'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText('SETTINGS', WIDTH/2, 50); ctx.shadowBlur = 0;
            
            const toggleHitboxBtn = new Button(WIDTH/2 - 100, 60, 200, 30, showHitboxes ? "Hitboxes: ON" : "Hitboxes: OFF", showHitboxes ? "#00ff00" : "#ff0000", showHitboxes ? "#00cc00" : "#cc0000"); toggleHitboxBtn.draw();
            if (mouseClicked && toggleHitboxBtn.isHovered() && !waitingForKey) showHitboxes = !showHitboxes;
            const toggleHurtboxBtn = new Button(WIDTH/2 - 100, 95, 200, 30, showHurtboxes ? "Col. Hitboxes: ON" : "Col. Hitboxes: OFF", showHurtboxes ? "#00ff00" : "#ff0000", showHurtboxes ? "#00cc00" : "#cc0000"); toggleHurtboxBtn.draw();
            if (mouseClicked && toggleHurtboxBtn.isHovered() && !waitingForKey) showHurtboxes = !showHurtboxes;

            const sliderX = WIDTH/2; const sliderY = 140; const sliderWidth = 200;
            ctx.fillStyle = '#fff'; ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.fillText(`Music Volume: ${Math.round(globalMusicVolume * 100)}%`, sliderX, sliderY - 15);
            ctx.fillStyle = '#555'; ctx.fillRect(sliderX - sliderWidth/2, sliderY, sliderWidth, 10);
            const handleX = (sliderX - sliderWidth/2) + (globalMusicVolume * sliderWidth);
            ctx.fillStyle = '#00d9ff'; ctx.beginPath(); ctx.arc(handleX, sliderY + 5, 10, 0, Math.PI*2); ctx.fill();

            // FIX: Cap player columns at 4, reduce font for 3+ players (implicit in layout logic, but explicit check here)
            // The existing layout does 4 columns. I will just ensure the font size is handled if we ever go >4.
            // Current code draws P1, P2, P3, P4. It fits.
            const playerIds = ['p1', 'p2', 'p3', 'p4']; const columnStartX = 20; const columnGap = 260; 
            playerIds.forEach((pid, i) => {
                let yPos = 180; const x = columnStartX + (i * columnGap);
                let pNum = pid.replace('p', ''); let displayName = `Player ${pNum}`; let color = '#fff';
                if (pid === 'p1') color = '#00d9ff'; if (pid === 'p2') color = '#ffaa00'; if (pid === 'p3') color = '#9c27b0'; if (pid === 'p4') color = '#ff00ff';
                ctx.fillStyle = color; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'left'; ctx.fillText(displayName, x, yPos); yPos += 35;
                const k = controlSchemes[pid]; let labels = ['Up', 'Down', 'Left', 'Right', 'Ability 1', 'Ability 2', 'Ability 3', 'M1']; let keyNames = ['up', 'down', 'left', 'right', 'ability1', 'ability2', 'ability3', 'm1'];
                keyNames.forEach((key, idx) => {
                    let keyDisplay = k[key] ? k[key].toUpperCase() : '';
                    const btn = new Button(x, yPos, 200, 40, `${labels[idx]}: ${keyDisplay}`, '#444', '#666'); btn.draw();
                    if (mouseClicked && btn.isHovered()) { settingsPlayer = pid; settingsControl = key; waitingForKey = true; }
                    yPos += 50;
                });
            });
            if (waitingForKey) { ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.fillStyle = '#ffff00'; ctx.font = '36px Arial'; ctx.textAlign = 'center'; ctx.fillText('Press any key...', WIDTH/2, HEIGHT/2); ctx.font = '20px Arial'; ctx.fillStyle = '#aaa'; ctx.fillText('(Press ESC to cancel)', WIDTH/2, HEIGHT/2 + 50); }
            const backBtn = new Button(WIDTH/2 - 75, 580, 150, 60, 'BACK', '#666', '#888'); backBtn.draw();
            if (mouseClicked && backBtn.isHovered() && !waitingForKey) gameState = MENU;
        }

        function handleSettingsClick() {
            const sliderX = WIDTH/2; const sliderY = 140; const sliderWidth = 200;
            if (mouseY >= sliderY - 10 && mouseY <= sliderY + 20 && mouseX >= sliderX - sliderWidth/2 - 10 && mouseX <= sliderX + sliderWidth/2 + 10) {
                isDraggingVolume = true;
                let newVol = (mouseX - (sliderX - sliderWidth/2)) / sliderWidth;
                globalMusicVolume = Math.max(0, Math.min(1, newVol));
                Object.values(audioEls).forEach(a => { if(!a.paused) a.volume = globalMusicVolume; });
            }
        }

        function drawGameSetup() {
            playMenuMusic();
            ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.shadowColor = '#0f3460'; ctx.shadowBlur = 5; ctx.fillStyle = '#e94560'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText('GAME SETUP', WIDTH/2, 50); ctx.shadowBlur = 0;
            let hoveredCharacter = null;
            ctx.fillStyle = '#00d9ff'; ctx.font = '28px Arial'; ctx.textAlign = 'left'; ctx.fillText('Players', 160, 100);
            const oneBounceBtn = new Button(20, 200, 120, 40, "ONE BOUNCE", gameSetup.isOneBounce ? "#ff00ff" : "#555", gameSetup.isOneBounce ? "#cc00cc" : "#777"); oneBounceBtn.draw();
            if (mouseClicked && oneBounceBtn.isHovered()) { gameSetup.isOneBounce = !gameSetup.isOneBounce; if (gameSetup.isOneBounce) { gameSetup.survivorCount = 4; gameSetup.selectedCharacters = []; } }
            if (gameSetup.isOneBounce) {
                ctx.fillStyle = '#ff00ff'; ctx.font = '16px Arial'; ctx.textAlign = 'left'; ctx.fillText('Select Player Count (2-4)', 20, 130);
                [2, 3, 4].forEach((count, idx) => {
                    const btn = new Button(20 + (idx * 90), 150, 80, 50, `${count}P`, gameSetup.survivorCount === count ? '#00ff00' : '#444', '#00cc00'); btn.draw();
                    if (mouseClicked && btn.isHovered()) gameSetup.survivorCount = count;
                });
                ctx.fillText('1 Random Player = Super Sonic', 20, 220); ctx.fillText(`${gameSetup.survivorCount - 1} Players = Killers`, 20, 240);
            } else {
                const countBtns = [new Button(60, 120, 80, 50, '1', gameSetup.survivorCount === 1 ? '#00ff00' : '#444', '#00cc00'), new Button(150, 120, 80, 50, '2', gameSetup.survivorCount === 2 ? '#00ff00' : '#444', '#00cc00'), new Button(240, 120, 80, 50, '3', gameSetup.survivorCount === 3 ? '#00ff00' : '#444', '#00cc00')];
                countBtns.forEach((btn, idx) => { btn.draw(); if (mouseClicked && btn.isHovered()) { gameSetup.survivorCount = idx + 1; if (gameSetup.selectedCharacters.length > idx + 1) gameSetup.selectedCharacters = gameSetup.selectedCharacters.slice(0, idx + 1); } });
            }
            const canStart = gameSetup.isOneBounce || gameSetup.selectedCharacters.length === gameSetup.survivorCount;
            if (!gameSetup.isOneBounce) {
                ctx.fillStyle = '#00d9ff'; ctx.font = '28px Arial'; ctx.textAlign = 'left'; ctx.fillText(`Select Characters (${gameSetup.selectedCharacters.length}/${gameSetup.survivorCount})`, 60, 280);
                let charNames = Object.keys(CHARACTERS);
                if (!devMode) charNames = charNames.filter(c => c !== 'TestDummy' && c !== 'n7' && c !== 'Super Sonic');
                const radius = 26; const spacingX = 115; const spacingY = 85; const startX = 60; const startY = 300;
                charNames.forEach((name, idx) => {
                    const char = CHARACTERS[name]; const x = startX + (idx % 2) * spacingX; const y = startY + Math.floor(idx / 2) * spacingY;
                    if (!gameSetup.selectedSkins[name]) gameSetup.selectedSkins[name] = 0;
                    const skinIndex = gameSetup.selectedSkins[name] || 0; const displayColor = CHARACTER_SKINS[name] ? CHARACTER_SKINS[name][skinIndex].color : char.color;
                    const isSelected = gameSetup.selectedCharacters.includes(name); const centerX = x + radius + 5; const centerY = y + radius + 5;
                    ctx.fillStyle = displayColor; ctx.globalAlpha = isSelected ?1.0 : 0.6; ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha =1.0;
                    if (isSelected) { ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2); ctx.stroke(); }
                    ctx.fillStyle = '#fff'; ctx.font = '14px Arial'; ctx.textAlign = 'center'; ctx.fillText(name, x + radius + 5, y + radius * 2 + 25);
                    const skinBtn = new Button(x + radius + 25, y + 5, 26, 26, '🎨', '#444', '#666'); skinBtn.draw();
                    const currentSkinName = (CHARACTER_SKINS[name] && CHARACTER_SKINS[name][skinIndex]) ? CHARACTER_SKINS[name][skinIndex].name : 'Classic';
                    ctx.fillStyle = '#ccc'; ctx.font = '10px Arial'; ctx.textAlign = 'left'; ctx.fillText(currentSkinName, x + radius + 55, y + 22);
                    const dist = Math.hypot(mouseX - centerX, mouseY - centerY); if (dist < radius) hoveredCharacter = name;
                    if (mouseClicked) {
                        const distClick = Math.hypot(mouseX - centerX, mouseY - centerY);
                        if (distClick < radius) { if (isSelected) gameSetup.selectedCharacters = gameSetup.selectedCharacters.filter(c => c !== name); else if (gameSetup.selectedCharacters.length < gameSetup.survivorCount) gameSetup.selectedCharacters.push(name); }
                        if (skinBtn.isHovered()) gameSetup.selectedSkins[name] = ((gameSetup.selectedSkins[name] || 0) + 1) % CHARACTER_SKINS[name].length;
                    }
                });
            } else { ctx.fillStyle = '#555'; ctx.font = '20px Arial'; ctx.textAlign = 'left'; ctx.fillText("Characters assigned randomly.", 60, 280); }
            ctx.fillStyle = '#ff5555'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'left'; ctx.fillText('Killer Settings', 400, 100);
            const killerBtn = new Button(400, 120, 180, 40, `Type: ${gameSetup.selectedKillerType}`, '#444', '#666'); killerBtn.draw();
            const killerSkins = KILLER_SKINS[gameSetup.selectedKillerType];
            if (killerSkins && killerSkins.length > 0) {
                const skinBtn = new Button(590, 125, 30, 30, '🎨', '#444', '#666'); skinBtn.draw();
                if (mouseClicked && skinBtn.isHovered()) gameSetup.selectedKillerSkin = (gameSetup.selectedKillerSkin + 1) % killerSkins.length;
                const skinName = killerSkins[gameSetup.selectedKillerSkin].name; ctx.fillStyle = '#aaa'; ctx.font = '16px Arial'; ctx.textAlign = 'left'; ctx.fillText(`Skin: ${skinName}`, 400, 180);
            }
            if (mouseClicked && killerBtn.isHovered()) { let idx = KILLER_TYPES.indexOf(gameSetup.selectedKillerType); gameSetup.selectedKillerType = KILLER_TYPES[(idx + 1) % KILLER_TYPES.length]; }
            if (!gameSetup.isOneBounce) {
                const modes = ['AI', 'Player']; modes.forEach((mode, idx) => {
                    const btn = new Button(400, 230 + idx * 45, 240, 40, `Control: ${mode}`, gameSetup.selectedKillerMode === mode ? '#ff0000' : '#444', '#cc0000'); btn.draw();
                    if (mouseClicked && btn.isHovered()) gameSetup.selectedKillerMode = mode;
                });
            } else { ctx.fillStyle = '#333'; ctx.fillRect(400, 230, 240, 90); ctx.fillStyle='#fff'; ctx.font='20px Arial'; ctx.textAlign='center'; ctx.fillText("CONTROL", 520, 275); ctx.fillText("ASSIGNED RANDOMLY", 520, 300); }
            ctx.fillStyle = '#ffaa00'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'left'; ctx.fillText('Map', 700, 100);
            let mapNames = Object.keys(MAPS); if (!devMode) mapNames = mapNames.filter(m => m !== 'Dev Random' && m !== '67');
            mapNames.forEach((mapName, idx) => {
                const btn = new Button(700, 130 + idx * 50, 300, 40, mapName, gameSetup.selectedMap === mapName ? '#00ff00' : '#444', '#00cc00'); btn.draw();
                if (mouseClicked && btn.isHovered()) gameSetup.selectedMap = mapName;
            });
            if (hoveredCharacter) drawCharacterHoverPanel(hoveredCharacter, 700, 340);
            const startBtn = new Button(WIDTH/2 - 100, 580, 200, 70, 'START GAME', canStart ? '#00ff00' : '#333', canStart ? '#00cc00' : '#555'); startBtn.draw();
            const backBtn = new Button(50, 590, 120, 60, 'BACK', '#666', '#888'); backBtn.draw();
            if (mouseClicked) { if (startBtn.isHovered() && canStart) initGame(); if (backBtn.isHovered()) gameState = MENU; }
        }

        function drawCharacterHoverPanel(charName, x, y) {
            const char = CHARACTERS[charName]; const panelW = 320; const panelH = 280;
            ctx.fillStyle = '#111'; ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.fillRect(x, y, panelW, panelH); ctx.strokeRect(x, y, panelW, panelH);
            ctx.fillStyle = char.color; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'left'; ctx.fillText(char.name, x + 15, y + 25); ctx.fillStyle = '#fff'; ctx.font = '16px Arial'; ctx.fillText(`Speed: ${char.speed}`, x + 15, y + 50);
            ctx.fillStyle = '#ddd'; ctx.font = 'bold 18px Arial'; ctx.fillText('Abilities:', x + 15, y + 75);
            let yPos = y + 100; for (let key in char.abilities) {
                const abil = char.abilities[key]; ctx.font = '14px Arial'; ctx.fillStyle = '#fff'; const cdSeconds = Math.ceil(abil.cooldown / 60); ctx.fillText(`${abil.name || key}: (${cdSeconds}s CD)`, x + 15, yPos);
                ctx.fillStyle = '#ccc'; ctx.font = '12px Arial'; const words = abil.description.split(' '); let lineY = yPos + 16; let line = ''; words.forEach(word => { const testLine = line + word + ' '; if (ctx.measureText(testLine).width > panelW - 30) { ctx.fillText(line, x + 15, lineY); lineY += 14; line = ''; } line += word + ' '; }); ctx.fillText(line, x + 15, lineY); yPos += (lineY - yPos) + 20; 
            }
        }

        function drawAboutAbilities() {
            playMenuMusic(); ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.shadowColor = '#0f3460'; ctx.shadowBlur = 15; ctx.fillStyle = '#e94560'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center'; ctx.fillText('CHARACTER ABILITIES', WIDTH/2, 50); ctx.shadowBlur = 0;
            ctx.font = '16px Arial'; ctx.textAlign = 'left'; let yPos = 100; const charNames = Object.keys(CHARACTERS);
            charNames.forEach(name => {
                const char = CHARACTERS[name]; ctx.fillStyle = char.color; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'left'; ctx.fillText(`${name} (Speed: ${char.speed})`, 60, yPos); yPos += 25; ctx.fillStyle = '#fff'; ctx.font = '15px Arial'; ctx.textAlign = 'left';
                for (let abilityName in char.abilities) { const ability = char.abilities[abilityName]; ctx.fillText(`• ${ability.description}`, 80, yPos); yPos += 20; yPos += 15; } yPos += 15;
            });
            const backBtn = new Button(WIDTH/2 - 75, 550, 150, 60, 'BACK', '#666', '#888'); backBtn.draw(); if (mouseClicked && backBtn.isHovered()) gameState = MENU;
        }

        function drawAboutCredits() {
            playMenuMusic(); ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.shadowColor = '#0f3460'; ctx.shadowBlur = 15; ctx.fillStyle = '#e94560'; ctx.font = 'bold 48px Arial'; ctx.textAlign = 'center'; ctx.fillText('CREDITS', WIDTH/2, 80); ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.fillText('Game Design & Development:', WIDTH/2, 150); ctx.fillStyle = '#00d9ff'; ctx.fillText('Aakercum, Jelani(goons to x), Jeff and DJ', WIDTH/2, 190); ctx.fillStyle = '#fff'; ctx.fillText('Based on "Outcome Memories"', WIDTH/2, 250); ctx.fillStyle = '#aaa'; ctx.font = '18px Arial'; ctx.textAlign = 'center'; ctx.fillText('Thank you for gooning to x!', WIDTH/2, 350);
            const backBtn = new Button(WIDTH/2 - 75, 500, 150, 60, 'BACK', '#666', '#888'); backBtn.draw(); if (mouseClicked && backBtn.isHovered()) gameState = MENU;
        }

        function drawPauseMenu() {
            drawGame(); ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.fillStyle = '#fff'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', WIDTH/2, HEIGHT/2 - 50);
            const resumeBtn = new Button(WIDTH/2 - 100, HEIGHT/2 + 20, 200, 60, 'RESUME', '#00d9ff', '#00b8d4'); const quitBtn = new Button(WIDTH/2 - 100, HEIGHT/2 + 100, 200, 60, 'QUIT TO MENU', '#e94560', '#c0354e'); resumeBtn.draw(); quitBtn.draw();
            if (mouseClicked) {
                if (resumeBtn.isHovered()) { gameState = PLAYING; try { if (gameSetup.isOneBounce) audioEls.oneBounce.play().catch(()=>{}); else if (gameSetup.selectedKillerType === 'Tripwire') audioEls.tripwire.play().catch(()=>{}); else if (gameSetup.selectedKillerType === '2011X') audioEls.x2011.play().catch(()=>{}); else if (gameSetup.selectedKillerType === 'Starved') audioEls.starved.play().catch(()=>{}); } catch(e) {} }
                if (quitBtn.isHovered()) { stopAllMusic(); gameState = MENU; }
            }
        }

        function drawHUD() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.fillRect(0, 0, WIDTH, 80); const maxBarWidth = 140; const startX = 20;
            if (gameSetup.isOneBounce) {
                const boss = players.find(p => p.isOneBounceBoss); if (boss) {
                    ctx.font = 'bold 16px Arial'; ctx.textAlign = 'left'; ctx.fillStyle = '#ffd700'; ctx.fillText(`SUPER SONIC (BOSS)`, startX, 20);
                    const barX = startX; const barY = 30; const barH = 14; ctx.fillStyle = '#000'; ctx.fillRect(barX, barY, maxBarWidth, barH); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, maxBarWidth, barH);
                    const hpPct = Math.max(0, boss.health / boss.maxHealth); const fillWidth = (maxBarWidth - 4) * hpPct; ctx.fillStyle = '#ffd700'; ctx.fillRect(barX + 2, barY + 2, fillWidth, barH - 4); ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'right'; ctx.fillText(`${Math.ceil(boss.health)}/${boss.maxHealth}`, barX + maxBarWidth - 2, barY + 11);
                }
            } else {
                players.forEach((p, i) => {
                    const xPos = startX + (i * 350); ctx.font = 'bold 16px Arial'; ctx.textAlign = 'left'; let status = ""; let color = '#fff';
                    if (p.escaped) { color = '#00ff00'; status = "(Escaped)"; } else if (!p.alive) { color = '#ff0000'; status = "(Dead)"; } else if (p.downed) { color = '#aaaa00'; status = "(Downed)"; }
                    ctx.fillStyle = color;                    ctx.fillText(`${p.playerLabel} ${p.characterName} ${status}`, xPos, 20);
                    const barX = xPos; const barY = 30; const barH = 14; ctx.fillStyle = '#000'; ctx.fillRect(barX, barY, maxBarWidth, barH); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, maxBarWidth, barH);
                    if (p.alive && !p.escaped) {
                        const hpPct = Math.max(0, p.downed ? 0 : (p.health / p.maxHealth)); const fillWidth = (maxBarWidth - 4) * hpPct; ctx.fillStyle = hpPct > 0.5 ? '#00ff00' : (hpPct > 0.25 ? '#ffff00' : '#ff0000'); ctx.fillRect(barX + 2, barY + 2, fillWidth, barH - 4);
                    }
                    let abilityY = 50; ctx.font = '11px Arial'; ctx.textAlign = 'left';
                    for (let key in p.characterData.abilities) {
                        let cd = p.abilityCooldowns[key]; let seconds = Math.ceil(cd / 60); let displayText = ""; let textColor = "#fff";
                        if (p.characterName === 'n7' || p.characterName === 'Super Sonic') {
                             if (key === 'teleport' && p.teleportState === 'windup') { displayText = "WINDUP"; textColor = p.characterName === 'Super Sonic' ? "#ff00ff" : "#00ffff"; }
                             else if (cd <= 0 || p.isOneBounceBoss) { displayText = "READY"; textColor = "#00ff00"; } else { displayText = `${seconds}s`; textColor = "#ffaaaa"; }
                        } else if (p.characterName === 'Blaze' && key === 'solsFlame') {
                            if (p.solsFlameState === 'windup') { displayText = "WINDUP"; textColor = "#ff00ff"; } else if (p.solsFlameEndlag > 0) { displayText = "Endlag"; textColor = "#aaa"; } else if (p.solsFlameBuffTimer > 0) { displayText = "BUFFED"; textColor = "#00ff00"; } else if (cd <= 0 || p.isOneBounceBoss) { displayText = "READY"; textColor = "#00ff00"; } else { displayText = `${seconds}s`; textColor = "#ffaaaa"; }
                        } else if (p.characterName === 'Tails' && key === 'gun') {
                             if (p.gunWindup > 0) { displayText = "CHARGING"; textColor = "#ffff00"; } else if (cd <= 0 || p.isOneBounceBoss) { displayText = "READY"; textColor = "#00ff00"; } else { displayText = `${seconds}s`; textColor = "#ffaaaa"; }
                        } else if (p.characterName === 'Cream' && key === 'cheese') {
                             if (p.abilityStates.cheeseWindup > 0) { displayText = "WINDUP"; textColor = "#ffe87c"; } else if (p.abilityStates.cheeseOut > 0) { displayText = "PLACED"; textColor = "#03fcf8"; } else if (cd <= 0 || p.isOneBounceBoss) { displayText = "READY"; textColor = "#00ff00"; } else { displayText = `${seconds}s`; textColor = "#ffaaaa"; }
                        } else {
                             if (cd <= 0 || p.isOneBounceBoss) { displayText = "READY"; textColor = "#00ff00"; } else { displayText = `${seconds}s`; textColor = "#ffaaaa"; }
                        }
                        const abilName = p.characterData.abilities[key].name || key.toUpperCase(); ctx.fillStyle = textColor; ctx.fillText(`${abilName}: ${displayText}`, xPos, abilityY); abilityY += 13; 
                    }
                });
            }
            const killerX = WIDTH - 240; ctx.fillStyle = 'rgba(50, 0, 0, 0.6)'; ctx.fillRect(killerX, 0, 240, 80); // Increased height for energy
            ctx.fillStyle = '#ff5555'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'left'; 
            const killerSkinName = killers.length > 0 ? killers[0].getCurrentSkinName() : 'Classic'; 
            ctx.fillText(`KILLER (${killerSkinName})`, killerX + 10, 20); ctx.font = '12px Arial'; ctx.fillStyle = '#fff'; let ky = 35;
            if (killers.length > 0) {
                let k = killers[0];
                if (k.type === '2011X') {
                    const m1CD = Math.ceil(k.m1Cooldown / 60); ctx.fillText(`M1: ${m1CD}s`, killerX + 10, ky); ky += 15; 
                    const trickCD = Math.ceil(k.trickeryCooldown / 60); const trickText = k.trickeryState !== 'idle' ? "ACTIVE" : `${trickCD}s`; 
                    ctx.fillStyle = k.trickeryState !== 'idle' ? '#ff00ff' : '#fff'; ctx.fillText(`Trickery: ${trickText}`, killerX + 10, ky); ky += 15;
                    const rushCD = Math.ceil(k.rushCooldown / 60); const rushText = k.rushMode > 0 ? "ACTIVE" : `${rushCD}s`; ctx.fillStyle = k.rushMode > 0 ? '#ff0000' : '#fff'; ctx.fillText(`Rush: ${rushText}`, killerX + 10, ky);
                } else if (k.type === 'Starved') {
                    const m1CD = Math.ceil(k.m1Cooldown / 60); ctx.fillText(`M1: ${m1CD}s`, killerX + 10, ky); ky += 15;
                    const projCD = Math.ceil(k.ability1Cooldown / 60); ctx.fillText(`Proj(AB1): ${projCD <= 0 ? 'READY' : projCD + 's'}`, killerX + 10, ky); ky += 15;
                    const minCD = Math.ceil(k.ability3Cooldown / 60); const minText = k.ability3State === 'windup' ? "SUMMONING" : `${minCD}s`; ctx.fillStyle = k.ability3State === 'windup' ? '#ff00ff' : '#fff'; ctx.fillText(`Minions(AB3): ${minText}`, killerX + 10, ky);
                    // Energy Bar
                    ky += 20;
                    ctx.fillStyle = '#333'; ctx.fillRect(killerX + 10, ky, 220, 8);
                    ctx.fillStyle = '#00ff00'; ctx.fillRect(killerX + 10, ky, 220 * (k.energy/k.maxEnergy), 8);
                    ctx.fillStyle = '#fff'; ctx.fillText(`Energy: ${Math.floor(k.energy)}`, killerX + 10, ky - 5);
                } else {
                    const bombCD = Math.ceil(k.bombCooldown / 60); ctx.fillStyle = '#fff'; ctx.fillText(`Bomb(AB2): ${k.bombThrowState === 'aiming' ? 'AIMING' : bombCD + 's'}`, killerX + 10, ky); ky += 15;
                    const wallCD = Math.ceil(k.wallCooldown / 60); ctx.fillText(`Wall(AB3): ${wallCD <= 0 ? 'READY' : wallCD + 's'}`, killerX + 10, ky); ky += 15;
                    const grappleCD = Math.ceil(k.grappleCooldown / 60); const grappleText = k.grappleState !== 'idle' ? "ACTIVE" : `${grappleCD <= 0 ? 'READY' : grappleCD + 's'}`; ctx.fillStyle = k.grappleState !== 'idle' ? '#ff0000' : '#fff'; ctx.fillText(`Grapple(AB1): ${grappleText}`, killerX + 10, ky);
                }
            }
            if (gameSetup.isOneBounce) {
                const timeLeft = Math.max(0, Math.ceil(oneBounceTimer / 60)); ctx.fillStyle = '#ff00ff'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; if (isEscapePhase) { ctx.fillText("RING ACTIVE - ESCAPE!", WIDTH/2, HEIGHT - 30); ctx.font = '20px Arial'; ctx.fillStyle = '#fff'; ctx.fillText('Touch Ring to Win', WIDTH/2, HEIGHT - 55); } else { ctx.fillText(`RING SPAWNS: ${timeLeft}s`, WIDTH/2, HEIGHT - 30); ctx.font = '20px Arial'; ctx.fillStyle = '#fff'; ctx.fillText('Survive as Last One!', WIDTH/2, HEIGHT - 55); }
            } else if (isEscapePhase && !gameSetup.isOneBounce) {
                const escapeTime = Math.ceil(escapeTimer / 60); ctx.fillStyle = '#ff0000'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText(`ESCAPE: ${escapeTime}s`, WIDTH/2, HEIGHT - 30); ctx.font = '20px Arial'; ctx.fillText('Touch Ring!', WIDTH/2, HEIGHT - 55);
            } else if (!gameSetup.isOneBounce) {
                const totalDuration = 7200; const timeLeft = Math.max(0, Math.ceil(totalDuration / 60) - Math.floor(gameTimer / 60)); ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.fillText(`TIME: ${timeLeft}s`, WIDTH/2, HEIGHT - 30);
            }
        }


        function initGame() {
            players = []; killers = []; projectiles = []; fireWalls = []; activeHitboxes = []; clones = []; minions = []; obstacles = []; gameParticles = []; isEscapePhase = false; escapeTimer = 0; escapeRing = null; wasLoneSurvivorTriggered = false; gameTimer = 0; oneBounceTimer = 3600; gameOverTimer = 0; 
            try { audioEls.menu.pause(); audioEls.menu.volume = 0; } catch(e) {}
            if (gameSetup.selectedMap === 'Dev Random') { for(let i=0; i<15; i++) { obstacles.push({ x: Math.random() * (WIDTH - 100) + 50, y: Math.random() * (HEIGHT - 100) + 50, w: Math.random() * 100 + 30, h: Math.random() * 100 + 30 }); } } else { obstacles = [...MAPS[gameSetup.selectedMap]]; }
            if (gameSetup.isOneBounce) {
                const totalPlayers = gameSetup.survivorCount; const playerIndices = Array.from({length: totalPlayers}, (_, i) => i); for (let i = playerIndices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [playerIndices[i], playerIndices[j]] = [playerIndices[j], playerIndices[i]]; }
                const survivorIndex = playerIndices[0]; const killerIndices = playerIndices.slice(1);
                let superSonic = new Player(0, 0, 'Super Sonic', survivorIndex + 1); superSonic.selectedSkin = 0; superSonic.isSolo = true; superSonic.isOneBounceBoss = true; superSonic.maxHealth = 500; superSonic.health = 500; superSonic.speed = CHARACTERS['Super Sonic'].speed; superSonic.findSafeSpawnPosition(obstacles); players.push(superSonic);
                killerIndices.forEach((playerIdx) => { 
                    const kType = Math.random() < 0.33 ? 'Tripwire' : (Math.random() < 0.5 ? '2011X' : 'Starved');
                    let killer = new Killer(0, 0, kType); killer.selectedSkin = 0; killer.humanControllerId = `p${playerIdx + 1}`; killer.isAI = false; killer.findSafeSpawnPosition(obstacles); killers.push(killer); 
                });
                oneBounceHumanControlledEntity = superSonic;
                try { audioEls.oneBounce.volume = globalMusicVolume; audioEls.oneBounce.play().catch(e => console.error("OneBounce Music Error", e)); } catch(e) {}
            } else {
                for(let i=0; i<gameSetup.survivorCount; i++) { const charName = gameSetup.selectedCharacters[i]; const player = new Player(0, 0, charName, i+1); if (gameSetup.selectedSkins[charName] !== undefined) player.selectedSkin = gameSetup.selectedSkins[charName]; player.isSolo = (gameSetup.survivorCount === 1); player.downed = false; player.hasBeenDowned = false; player.findSafeSpawnPosition(obstacles); players.push(player); }
                let mainKiller = new Killer(0, 0, gameSetup.selectedKillerType); mainKiller.selectedSkin = gameSetup.selectedKillerSkin; mainKiller.isAI = (gameSetup.selectedKillerMode === 'AI'); if (!mainKiller.isAI) { mainKiller.humanControllerId = `p${gameSetup.survivorCount + 1}`; } mainKiller.findSafeSpawnPosition(obstacles); killers.push(mainKiller);
                try { 
                    if (gameSetup.selectedKillerType === 'Tripwire') { audioEls.tripwire.volume = globalMusicVolume; audioEls.tripwire.play().catch(e => console.error("Tripwire Music Error", e)); } 
                    else if (gameSetup.selectedKillerType === '2011X') { audioEls.x2011.volume = globalMusicVolume; audioEls.x2011.play().catch(e => console.error("X2011 Music Error", e)); }
                    else if (gameSetup.selectedKillerType === 'Starved') { audioEls.starved.volume = globalMusicVolume; audioEls.starved.play().catch(e => console.error("Starved Music Error", e)); }
                } catch(e) {}
            }
            const START_CD = 180; killers.forEach(k => { k.m1Cooldown = START_CD; k.rushCooldown = START_CD; k.teleportCooldown = START_CD; k.specialCooldown = START_CD; k.bombCooldown = START_CD; k.grappleCooldown = START_CD; k.trickeryCooldown = START_CD; k.ability1Cooldown = START_CD; k.ability3Cooldown = START_CD; });
            gameState = PLAYING;
        }

        function updateGame() {
            if (gameState !== PLAYING) return;
            const alivePlayers = players.filter(p => p.alive && !p.escaped);
            if (alivePlayers.length === 0) { gameState = GAME_OVER; gameOverMessage = players.some(p => p.escaped) ? "SURVIVORS ESCAPED" : "KILLERS WIN"; return; }
            gameTimer++;
            let oneBounceInput = { keys: {}, m1Clicked: false };
            const getKey = (keyName) => { if (!keyName) return false; return keys[keyName.toLowerCase()] || keys[keyName]; };
            if (gameSetup.isOneBounce) {
                const bossControls = controlSchemes[oneBounceHumanControlledEntity.controlId];
                oneBounceInput.keys.up = getKey(bossControls.up); oneBounceInput.keys.down = getKey(bossControls.down); oneBounceInput.keys.left = getKey(bossControls.left); oneBounceInput.keys.right = getKey(bossControls.right);
                oneBounceInput.keys.rush = getKey(bossControls.ability1); oneBounceInput.keys.teleport = getKey(bossControls.ability2); oneBounceInput.keys.special = getKey(bossControls.m1); oneBounceInput.keys.m1 = getKey(bossControls.m1); oneBounceInput.m1Clicked = getKey(bossControls.m1);
            }
            if (gameSetup.isOneBounce) {
                if (isEscapePhase) { let boss = players[0]; if (boss && boss.alive && escapeRing) { const dist = Math.hypot(boss.x - escapeRing.x, boss.y - escapeRing.y); if (dist < escapeRing.radius + boss.size) { gameState = GAME_OVER; gameOverMessage = "SuperSonic WINS"; return; } } }
                else { oneBounceTimer--; if (oneBounceTimer <= 0) { isEscapePhase = true; escapeRing = new Ring(); } }
                try { audioEls.oneBounce.volume = Math.min(audioEls.oneBounce.volume + 0.05, globalMusicVolume); } catch(e){}
            } 
            else {
                const isLoneSurvivor = (alivePlayers.length === 1 && players.length > 1) || (players.length === 1 && alivePlayers.length === 1);
                if (isLoneSurvivor) {
                    const survivor = alivePlayers[0]; let trackToPlay = null;
                    try { audioEls.tripwire.volume = Math.max(audioEls.tripwire.volume - 0.1, 0); audioEls.x2011.volume = Math.max(audioEls.x2011.volume - 0.1, 0); audioEls.starved.volume = Math.max(audioEls.starved.volume - 0.1, 0); if(audioEls.tripwire.volume <= 0.01) { audioEls.tripwire.pause(); audioEls.tripwire.volume = 0; } if(audioEls.x2011.volume <= 0.01) { audioEls.x2011.pause(); audioEls.x2011.volume = 0; } if(audioEls.starved.volume <= 0.01) { audioEls.starved.pause(); audioEls.starved.volume = 0; } } catch(e) {}
                    if (survivor.characterName === 'TestDummy') trackToPlay = audioEls.charlieLms; else if (gameSetup.selectedKillerType === 'Tripwire' && killers[0].getCurrentSkinName() === 'John Doe') trackToPlay = audioEls.doe; else { if (survivor.characterName === 'Sonic') trackToPlay = audioEls.lmsSonic; else if (survivor.characterName === 'Tails') trackToPlay = audioEls.lmsTails; else if (survivor.characterName === 'Knuckles') trackToPlay = audioEls.lmsKnuckles; else if (survivor.characterName === 'Blaze') trackToPlay = audioEls.lmsBlaze; else if (survivor.characterName === 'Cream') trackToPlay = audioEls.lmsCream; else if (survivor.characterName === 'n7') trackToPlay = audioEls.lms; else trackToPlay = audioEls.lms; }
                    if (trackToPlay) {
                        try { if (trackToPlay.paused) { [audioEls.lmsSonic, audioEls.lmsTails, audioEls.lmsKnuckles, audioEls.lmsBlaze, audioEls.lmsCream, audioEls.lms, audioEls.doe, audioEls.charlieLms].forEach(t => { if(t !== trackToPlay) { t.pause(); t.volume = 0; } }); trackToPlay.volume = 0; trackToPlay.play().catch(e => {}); } trackToPlay.volume = Math.min(trackToPlay.volume + 0.05, globalMusicVolume); } catch(e) {}
                    }
                } else {
                    try { [audioEls.lmsSonic, audioEls.lmsTails, audioEls.lmsKnuckles, audioEls.lmsBlaze, audioEls.lmsCream, audioEls.lms, audioEls.doe, audioEls.charlieLms].forEach(t => { t.volume = Math.max(t.volume - 0.1, 0); if(t.volume <= 0.01) t.pause(); }); if (gameSetup.selectedKillerType === 'Tripwire') { if (audioEls.tripwire.paused && audioEls.tripwire.volume < 0.1) { audioEls.x2011.pause(); audioEls.x2011.volume = 0; audioEls.starved.pause(); audioEls.starved.volume = 0; audioEls.tripwire.volume = 0; audioEls.tripwire.play().catch(e => {}); } audioEls.tripwire.volume = Math.min(audioEls.tripwire.volume + 0.05, globalMusicVolume); } else if (gameSetup.selectedKillerType === '2011X') { if (audioEls.x2011.paused && audioEls.x2011.volume < 0.1) { audioEls.tripwire.pause(); audioEls.tripwire.volume = 0; audioEls.starved.pause(); audioEls.starved.volume = 0; audioEls.x2011.volume = 0; audioEls.x2011.play().catch(e => {}); } audioEls.x2011.volume = Math.min(audioEls.x2011.volume + 0.05, globalMusicVolume); } else if (gameSetup.selectedKillerType === 'Starved') { if (audioEls.starved.paused && audioEls.starved.volume < 0.1) { audioEls.tripwire.pause(); audioEls.tripwire.volume = 0; audioEls.x2011.pause(); audioEls.x2011.volume = 0; audioEls.starved.volume = 0; audioEls.starved.play().catch(e => {}); } audioEls.starved.volume = Math.min(audioEls.starved.volume + 0.05, globalMusicVolume); } } catch(e) {}
                }
                if (isEscapePhase) { escapeTimer--; if (escapeTimer <= 0) { gameState = GAME_OVER; gameOverMessage = "KILLERS WIN (Time's Up)"; } }
                else {
                    const TOTAL_GAME_TIME = 7200; const activePlayers = players.filter(p => p.alive && !p.escaped && !p.downed).length; 
                    if (activePlayers === 1 && !wasLoneSurvivorTriggered && gameTimer > 300) { gameTimer = 3900; wasLoneSurvivorTriggered = true; }
                    if (gameTimer >= TOTAL_GAME_TIME) { isEscapePhase = true; escapeTimer = 1200; escapeRing = new Ring(); }
                }
            }
            killers.forEach(killer => {
                let killerInput = { keys: {}, m1Clicked: false };
                if (killers.length > 0 && !killer.isAI && killer.humanControllerId) {
                    const cid = killer.humanControllerId; const kScheme = controlSchemes[cid];
                    killerInput.keys.up = getKey(kScheme.up); killerInput.keys.down = getKey(kScheme.down); killerInput.keys.left = getKey(kScheme.left); killerInput.keys.right = getKey(kScheme.right);
                    killerInput.keys.rush = getKey(kScheme.ability1); killerInput.keys.teleport = getKey(kScheme.ability2); killerInput.keys.special = getKey(kScheme.ability3); killerInput.m1Clicked = getKey(kScheme.m1);
                    killerInput.keys.ability1 = getKey(kScheme.ability1); killerInput.keys.ability3 = getKey(kScheme.ability3); // For Starved
                } else if (!killer.isAI && !killer.humanControllerId && !gameSetup.isOneBounce) { killer.isAI = true; }
                let customWalls = []; killers.forEach(otherK => { if (otherK.type === 'Tripwire' && otherK.customWall) customWalls.push(otherK.customWall); }); killer.update(players, obstacles, killerInput, customWalls);
            });
            let customWalls = []; killers.forEach(k => { if (k.type === 'Tripwire' && k.customWall) customWalls.push(k.customWall); });
            
            // UPDATE MINIONS
            for(let i = minions.length - 1; i >= 0; i--) {
                minions[i].update(players, obstacles);
                if (minions[i].dead) minions.splice(i, 1);
            }

            players.forEach(p => { p.move(obstacles, killers, customWalls, oneBounceInput); if (isEscapePhase && escapeRing && !p.escaped && !p.downed && p.alive) { const dist = Math.hypot(p.x - escapeRing.x, p.y - escapeRing.y); if (dist < escapeRing.radius + p.size) { p.escaped = true; } } if (!p.isOneBounceBoss && !p.downed && !p.escaped && p.alive) { players.forEach(p2 => { if (p2 !== p && p2.alive && p2.downed) { const dist = Math.hypot(p.x - p2.x, p.y - p2.y); if (dist < p.size + p2.size) { p2.downed = false; p2.health = 70; p2.invincible = 120; p2.speedBoost = 60; p.speedBoost = 60; } } }); } });
            killers.forEach(k => { if (k.stunned > 0) return; for (let i = clones.length - 1; i >= 0; i--) { let c = clones[i]; if (!c.alive) continue; const dist = Math.hypot(k.x - c.x, k.y - c.y); if (dist < k.size + c.size) { c.alive = false; k.stun(10); } } }); clones = clones.filter(c => c.alive);
            for (let i = fireWalls.length - 1; i >= 0; i--) { fireWalls[i].update(players, killers); if (fireWalls[i].shouldRemove()) fireWalls.splice(i, 1); }
            for (let i = projectiles.length - 1; i >= 0; i--) { let b = projectiles[i]; b.update(); if (!b.active) { projectiles.splice(i, 1); continue; } for (let k of killers) { const dist = Math.hypot(b.x - k.x, b.y - k.y); if(dist < k.size + b.radius) { 
                if (b.isStarved) {
                    k.health = Math.min(k.maxHealth, k.health + 10); // Heal 10
                    gameParticles.push(new Explosion(b.x, b.y, '#00ff00'));
                } else {
                    gameParticles.push(new Explosion(b.x, b.y, '#ffff00'));
                }
                k.stun(b.stunDuration); b.active = false; break; 
            } } if(!b.active) projectiles.splice(i, 1); }
            for (let i = gameParticles.length - 1; i >= 0; i--) { gameParticles[i].update(); if(gameParticles[i].isDone()) gameParticles.splice(i, 1); }
            for (let i = activeHitboxes.length - 1; i >= 0; i--) {
                let h = activeHitboxes[i]; h.duration--;
                if (h.owner instanceof Killer && players.some(p => p.isOneBounceBoss)) { let boss = players.find(p => p.isOneBounceBoss); if(boss) { const dist = Math.hypot(boss.x - h.x, boss.y - h.y); if(dist < boss.size + h.radius) h.damage = Math.min(h.damage, 50); } }
                if (h.owner instanceof Player) { 
                    if (!h.hasHit) { killers.forEach(k => { const dist = Math.hypot(k.x - h.x, k.y - h.y); if(dist < k.size + h.radius) { if (h.type === 'knuckles_punch') { k.takeDamage(0, h.owner); const angle = Math.atan2(k.y - h.owner.y, k.x - h.owner.x); k.x += Math.cos(angle) * 100; k.y += Math.sin(angle) * 100; k.stun(75); h.owner.punchState = 'idle'; } else if (h.type === 'blaze_ult') k.stun(30); } }); }
                } else { 
                    if (!h.hasHit) { let guestHit = false; players.forEach(p => { const dist = Math.hypot(p.x - h.x, p.y - h.y); if(dist < p.size + h.radius) { 
                        // APPLY BLEED 
                        if (h.type === 'killer_m1_2011x' && h.data && h.data.applyBleed && p.bleedTimer <= 0) {
                            p.bleedTimer = 180; // 3s
                        }
                        // APPLY INVERTED CONTROLS
                        if (h.type === 'gods_trickery') {
                            p.invertedControlsTimer = 180; // 3s
                        }

                        if (guestHit) return; 
                        if (!p.downed || (p.downed && h.type === 'killer_m1')) { 
                            p.takeDamage(h.damage, h.owner); 
                            if (!p.alive && gameSetup.isOneBounce) { gameState = GAME_OVER; gameOverMessage = "KILLERS WIN"; } 
                            if (p.characterName === 'Knuckles' && p.blockState === 'blocking') { guestHit = true; } 
                            h.hasHit = true; 
                        } 
                    } }); }
                }
                if (h.type === 'sols_flame') { if (!h.hasHit) { killers.forEach(k => { const dist = Math.hypot(k.x - h.x, k.y - h.y); if(dist < k.size + h.radius) { h.hasHit = true; k.immobilizedTimer = h.owner.characterData.abilities.solsFlame.pushDuration; k.immobilizedSource = h.owner; } }); } }
                if (h.duration <= 0) activeHitboxes.splice(i, 1);
            }
        }

        function drawGame() {
            ctx.fillStyle = '#282828'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
            obstacles.forEach(obs => { ctx.fillStyle = '#444'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(obs.x, obs.y, obs.w, obs.h); });
            fireWalls.forEach(fw => fw.draw()); clones.forEach(c => c.draw());
            
            // DRAW MINIONS
            minions.forEach(m => m.draw());

            players.forEach(p => {
                if (p.characterName === 'Cream' && p.abilityStates.cheeseOut > 0 && p.abilityStates.cheeseX != null) {
                    const cx = p.abilityStates.cheeseX; const cy = p.abilityStates.cheeseY;
                    ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI*2); ctx.stroke();
                    ctx.fillStyle = '#6aaeeb'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#cc9900'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = '#cc9900'; ctx.beginPath(); ctx.arc(cx - 3, cy - 2, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 3, cy + 2, 2, 0, Math.PI*2); ctx.fill();
                }
            });
            projectiles.forEach(p => p.draw()); gameParticles.forEach(p => p.draw()); if (escapeRing) escapeRing.draw(); players.forEach(p => p.draw()); killers.forEach(k => k.draw());
            if (showHitboxes) { activeHitboxes.forEach(h => { ctx.strokeStyle = `rgba(255, 0, 0, ${h.duration / h.maxDuration})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2); ctx.stroke(); }); }
            if (showHurtboxes) { ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1; players.forEach(p => { if (p.alive) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.stroke(); } }); killers.forEach(k => { if (k.respawnTimer <= 0) { ctx.beginPath(); ctx.arc(k.x, k.y, k.size, 0, Math.PI*2); ctx.stroke(); } }); }
            drawHUD();
        }

        function drawGameOver() {
            drawGame(); playMenuMusic();
            try { [audioEls.tripwire, audioEls.x2011, audioEls.lms, audioEls.oneBounce, audioEls.doe, audioEls.lmsSonic, audioEls.lmsTails, audioEls.lmsKnuckles, audioEls.lmsBlaze, audioEls.lmsCream, audioEls.charlieLms, audioEls.starved].forEach(a => { if(a.volume > 0) { a.volume -= 0.02; if(a.volume <= 0) a.pause(); } }); } catch(e) {}
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0, WIDTH, HEIGHT); ctx.fillStyle = '#fff'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center'; ctx.fillText(gameOverMessage, WIDTH/2, HEIGHT/2 - 80); ctx.font = '24px Arial'; let yPos = HEIGHT/2 - 20; players.forEach(p => { const label = p.playerLabel || `P${players.indexOf(p) + 1}`; let status = ""; if (p.escaped) { ctx.fillStyle = '#00ff00'; status = "ESCAPED"; } else if (!p.alive) { ctx.fillStyle = '#ff0000'; status = "DEAD"; } else if (p.downed) { ctx.fillStyle = '#aaaa00'; status = "DOWNED"; } else { ctx.fillStyle = '#aaa'; status = "ALIVE"; } ctx.fillText(`${label} (${p.characterName}): ${status}`, WIDTH/2, yPos); yPos += 40; });
            gameOverTimer++; const secondsLeft = Math.ceil((120 - gameOverTimer) / 60); ctx.fillStyle = '#ffff00'; ctx.font = '20px Arial'; ctx.fillText(`Returning to Character Select in ${secondsLeft}...`, WIDTH/2, HEIGHT/2 + 80);
            if (gameOverTimer > 120) { stopAllMusic(true); gameState = GAME_SETUP; gameOverTimer = 0; }
        }

        loadStorage();
        function gameLoop() {
            if (gameState === MENU) drawMenu();
            else if (gameState === GAME_SETUP) drawGameSetup();
            else if (gameState === SETTINGS) drawSettings();
            else if (gameState === ABOUT_ABILITIES) drawAboutAbilities();
            else if (gameState === ABOUT_CREDITS) drawAboutCredits();
            else if (gameState === PAUSED) drawPauseMenu();
            else if (gameState === PLAYING) { updateGame(); drawGame(); }
            else if (gameState === GAME_OVER) { drawGameOver(); }
            mouseClicked = false; requestAnimationFrame(gameLoop);
        }
        gameLoop();
