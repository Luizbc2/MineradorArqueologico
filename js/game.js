/* Minerador Arqueológico - Remake Realista
 * Engine Física Customizada em Canvas 2D
 */

(function(){
  // --- Configurações e Constantes ---
  const CANVAS = document.getElementById('game');
  const CTX = CANVAS.getContext('2d', { alpha: false }); // Otimização
  const TILE_SIZE = 32;
  const GRAVITY = 1200; // pixels/s^2
  const JUMP_FORCE = -420;
  const MOVE_SPEED = 180;
  const MOVE_ACCEL = 1200;
  const FRICTION = 0.82; // damping factor
  const WORLD_WIDTH = 40; // Mais largo para exploração
  const WORLD_HEIGHT = 600; // Profundo

  // Elementos UI
  const UI = {
    depth: document.getElementById('depth'),
    energy: document.getElementById('energy'),
    energyFill: document.getElementById('energy-fill'),
    inv: {
      carvao: document.getElementById('inv-carvao'),
      ferro: document.getElementById('inv-ferro'),
      ouro: document.getElementById('inv-ouro'),
      diamante: document.getElementById('inv-diamante'),
      bau: document.getElementById('inv-bau'),
      cards: document.getElementById('cards-count')
    },
    pickaxe: document.getElementById('pickaxe-level'),
    screens: {
      start: document.getElementById('instructions'),
      pause: document.getElementById('pause'),
      card: document.getElementById('arch-card'),
      upgrade: document.getElementById('upgrade')
    },
    btns: {
      start: document.getElementById('btn-start'),
      upgradeOpen: document.getElementById('btn-upgrade-open'),
      upgradeClose: document.getElementById('btn-upgrade-close'),
      upgradeAction: document.getElementById('btn-upgrade'),
      surface: document.getElementById('btn-surface'),
      cardClose: document.querySelector('#arch-card .close')
    },
    texts: {
      card: document.getElementById('arch-text'),
      upgradeCurrent: document.getElementById('upg-current'),
      upgradeCost: document.getElementById('upg-cost')
    }
  };

  // --- Dados de Conteúdo (Preservados) ---
  const ARCHAEOLOGY_FACTS = [
    'As Pinturas Rupestres de Arapoti: Marcas em pedra com figuras humanas, animais e símbolos geométricos. Serviam como registros cerimoniais e narrativas visuais de comunidades indígenas antigas.',
    'As Pinturas de Jaguariaíva II: Painéis sobrepostos mostram que diferentes gerações ocuparam o mesmo espaço. Registram rituais, caça e a memória coletiva da comunidade.',
    'As Gravuras Rupestres de Tibagi II: Cenas do cotidiano e da natureza representadas artisticamente. Revelam conhecimento detalhado sobre fauna, flora e práticas culturais.',
    'A Cerâmica Decorada de Ortigueira II: Fragmentos com desenhos geométricos e pigmentos naturais. Mostram habilidade técnica e significado simbólico nas atividades diárias e rituais.',
    'A Cerâmica de Guarapuava II: Utensílios de uso doméstico e agrícola, associados a aldeias antigas. Indicativos de um modo de vida organizado e adaptado ao planalto paranaense.',
    'A Cerâmica de Ponta Grossa: Fragmentos que evidenciam trocas culturais entre diferentes grupos indígenas, mostrando a complexidade social do Paraná pré-colonial.',
    'A Cerâmica Itararé-Taquara: Produção simples, mas funcional, utilizada em casas subterrâneas e na vida cotidiana. Reflete técnicas adaptadas ao clima e à geografia do planalto.',
    'O Sambaqui Rio Itiberê: Estrutura de conchas e ossos humanos que revela contato cultural entre diferentes povos indígenas da região costeira.',
    'As Casas Subterrâneas de Irati: Estruturas circulares e subterrâneas usadas por povos Itararé-Taquara. Adaptadas ao clima frio, demonstram engenhosidade arquitetônica.',
    'A Aldeia de União da Vitória: Vestígios de habitações, cerâmica e ferramentas de pedra que indicam ocupação contínua de povos indígenas por milênios.',
    'Os Sambaquis de Morretes: Estruturas com restos de conchas, ossos e artefatos, mostrando como a comunidade utilizava os recursos naturais do litoral de forma sustentável.',
    'As Cerâmicas do Alto Iguaçu: Fragmentos agrícolas e domésticos de mais de 2.000 anos. Demonstram técnicas avançadas de produção e conservação de alimentos.',
    'O Sambaqui de Matinhos II: Montes de conchas organizados em camadas que indicam rituais, sepultamentos e ocupação prolongada de grupos pesqueiros.',
    'Os Sambaquis da Ilha do Mel II: Ossos humanos e artefatos encontrados juntos revelam a importância do espaço para cerimônias e rituais religiosos.',
    'A Aldeia de Cianorte: Fossas e depósitos de alimentos e sementes que indicam planejamento agrícola e gestão comunitária de recursos.',
    'A Aldeia de Bituruna II: Indícios de interação cultural entre Guarani e Kaingang. Ferramentas, cerâmica e restos de alimentos revelam trocas econômicas e sociais.',
    'As Rotas Indígenas do Planalto: Caminhos usados para deslocamento, comércio e contato cultural entre grupos do litoral e do interior do Paraná.',
    'Os Sambaquis de Guaraqueçaba II: Estruturas de conchas e ossos mostrando ocupações sucessivas ao longo de séculos, com registro de rituais e práticas alimentares.',
    'A Cerâmica Pintada de Telêmaco Borba: Fragmentos decorados com pigmentos minerais e padrões geométricos, usados em rituais e atividades diárias.',
    'Os Sambaquis de Paranaguá II: Monumentos construídos para moradia, enterramento e cerimônias, mostrando a complexidade social das comunidades litorâneas.',
    'As Pinturas Rupestres do Canyon Guartelá II: Painéis relacionados a mitos de fertilidade e caça, preservando o conhecimento ancestral indígena.',
    'O Sambaqui de Pontal do Paraná II: Localização estratégica próxima a manguezais, usado para coleta de mariscos e pesca, refletindo adaptação ao ecossistema costeiro.',
    'As Cerâmicas Guarani do Litoral II: Utensílios domésticos e religiosos, revelando aspectos da vida cotidiana, rituais e simbolismo cultural.',
    'O Sambaqui do Morro do Ouro II: Ossadas e cerâmica que evidenciam práticas funerárias complexas e organização comunitária em Antonina.',
    'As Pinturas de Ortigueira II: Representações de caça, vida cotidiana e rituais, registrando memórias coletivas e práticas sociais dos povos indígenas.'
  ];

  // --- Sistema de Input ---
  const Input = {
    keys: {},
    mouse: { x: 0, y: 0, left: false },
    init(){
      window.addEventListener('keydown', e => { this.keys[e.code] = true; });
      window.addEventListener('keyup', e => { this.keys[e.code] = false; this.handleKeyUp(e.code); });
      CANVAS.addEventListener('mousemove', e => {
        const rect = CANVAS.getBoundingClientRect();
        const scaleX = CANVAS.width / rect.width;
        const scaleY = CANVAS.height / rect.height;
        this.mouse.x = (e.clientX - rect.left) * scaleX;
        this.mouse.y = (e.clientY - rect.top) * scaleY;
      });
      CANVAS.addEventListener('mousedown', e => { if(e.button===0) this.mouse.left = true; });
      CANVAS.addEventListener('mouseup', e => { if(e.button===0) this.mouse.left = false; });
    },
    handleKeyUp(code){
      if(code === 'Escape') Game.togglePause();
      if(code === 'KeyU') Game.toggleUpgrade();
      if(code === 'KeyR') Game.toSurface();
    },
    isDown(code){ return !!this.keys[code]; }
  };

  // --- Utils ---
  const RNG = {
    seed: Date.now(),
    next(){
      let t = this.seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  };

  // --- Classes Principais ---

  class Parallax {
    constructor(w, h){
      this.layers = [
        { speed: 0.1, particles: [] },
        { speed: 0.2, particles: [] }
      ];
      this.w = w; this.h = h;
      this.init();
    }
    init(){
      for(let l of this.layers){
        for(let i=0; i<40; i++){
          l.particles.push({
            x: Math.random() * this.w,
            y: Math.random() * this.h,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.1
          });
        }
      }
    }
    draw(ctx, camX, camY){
      for(let l of this.layers){
        ctx.fillStyle = '#fff';
        for(let p of l.particles){
          let x = (p.x - camX * l.speed) % this.w;
          let y = (p.y - camY * l.speed) % this.h;
          if(x<0) x+=this.w;
          if(y<0) y+=this.h;
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(x,y,p.size,p.size);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  class SpriteManager {
    constructor(){
      this.cache = {};
      this.initTiles();
    }

    initTiles(){
      // Gera texturas procedurais para não depender de assets externos
      const TYPES = ['dirt', 'stone', 'coal', 'iron', 'gold', 'diamond', 'bedrock', 'chest', 'open_chest'];
      TYPES.forEach(t => this.generateTile(t));
    }

    generateTile(type){
      const c = document.createElement('canvas');
      c.width = TILE_SIZE; c.height = TILE_SIZE;
      const ctx = c.getContext('2d');

      // Base
      let color = '#000';
      if(type==='dirt') color='#7b5a3b';
      if(type==='stone') color='#65707e';
      if(type==='coal') color='#2d343b';
      if(type==='iron') color='#7a593d';
      if(type==='gold') color='#9d7d29';
      if(type==='diamond') color='#2d98a0';
      if(type==='bedrock') color='#17191c';
      if(type.includes('chest')) color='#b07a2a';

      ctx.fillStyle = color;
      ctx.fillRect(0,0,TILE_SIZE,TILE_SIZE);

      // Noise texture
      if(!type.includes('chest')){
        for(let i=0; i<40; i++){
          ctx.fillStyle = Math.random()>0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
          ctx.fillRect(Math.random()*TILE_SIZE, Math.random()*TILE_SIZE, 2, 2);
        }
      }

      // Detalhes específicos
      if(type==='stone' || type==='coal' || type==='iron' || type==='gold' || type==='diamond'){
         // Bordas de pedra
         ctx.fillStyle = 'rgba(0,0,0,0.2)';
         ctx.fillRect(0,0,TILE_SIZE,1);
         ctx.fillRect(0,0,1,TILE_SIZE);
      }

      if(['coal','iron','gold','diamond'].includes(type)){
        // Pepitas
        const oreColor = {
          coal: '#111', iron: '#eecfa1', gold: '#ffd700', diamond: '#00ffff'
        }[type];
        ctx.fillStyle = oreColor;
        for(let i=0; i<5; i++){
          const x = 4 + Math.random()*(TILE_SIZE-8);
          const y = 4 + Math.random()*(TILE_SIZE-8);
          ctx.fillRect(x,y, 4,4);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(x+1,y+1,2,2);
          ctx.fillStyle = oreColor;
        }
      }

      if(type === 'chest'){
        // Desenho simples de baú fechado
        ctx.fillStyle = '#8e571a';
        ctx.fillRect(4, 8, 24, 20); // corpo
        ctx.fillStyle = '#b87724';
        ctx.fillRect(3, 6, 26, 6); // tampa
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(14, 16, 4, 6); // fecho
      }

      if(type === 'open_chest'){
        // Baú aberto
        ctx.fillStyle = '#8e571a';
        ctx.fillRect(4, 8, 24, 20); // corpo
        // Interior escuro
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(6, 10, 20, 16);
        // Tampa para trás
        ctx.fillStyle = '#b87724';
        ctx.fillRect(3, 2, 26, 6);
      }

      this.cache[type] = c;
    }

    get(type){ return this.cache[type]; }
  }

  class World {
    constructor(width, height){
      this.width = width;
      this.height = height;
      this.tiles = new Uint8Array(width * height);
      this.lightMap = new Float32Array(width * height);
      this.Types = {
        EMPTY: 0, DIRT: 1, STONE: 2, COAL: 3, IRON: 4, GOLD: 5, DIAMOND: 6, BEDROCK: 7, CHEST: 8, OPEN_CHEST: 9
      };
      this.generate();
    }

    generate(){
      // Geração procedural simples
      for(let y=0; y<this.height; y++){
        for(let x=0; x<this.width; x++){
          let t = this.Types.DIRT;

          if(y > 10) t = this.Types.STONE;
          if(y >= this.height-2) t = this.Types.BEDROCK;

          // Minérios e Cavernas
          if(y > 5 && t !== this.Types.BEDROCK){
            const r = RNG.next();
            // Cavernas (ruído simples simulado)
            if(r < 0.02) t = this.Types.EMPTY;
            else {
              // Probabilidade de minérios baseada na profundidade
              const depthRate = y / this.height;
              if(t === this.Types.STONE){
                 if(RNG.next() < 0.003 + depthRate*0.015) t = this.Types.DIAMOND;
                 else if(RNG.next() < 0.008 + depthRate*0.025) t = this.Types.GOLD;
                 else if(RNG.next() < 0.02 + depthRate*0.04) t = this.Types.IRON;
                 else if(RNG.next() < 0.04 + depthRate*0.05) t = this.Types.COAL;
              }
            }
          }

          // Superfície
          if(y < 4) t = this.Types.EMPTY;
          if(y === 4) t = this.Types.DIRT; // Grama seria aqui

          // Baús
          if(t !== this.Types.EMPTY && t !== this.Types.BEDROCK && y > 15){
             if(RNG.next() < 0.005) t = this.Types.CHEST;
          }

          this.set(x,y,t);
        }
      }
      // Plataforma inicial
      for(let x=10; x<30; x++) this.set(x,4,this.Types.DIRT);
    }

    get(x, y){
      if(x<0 || x>=this.width || y<0 || y>=this.height) return this.Types.BEDROCK;
      return this.tiles[y * this.width + x];
    }

    set(x, y, v){
      if(x>=0 && x<this.width && y>=0 && y<this.height){
        this.tiles[y * this.width + x] = v;
      }
    }

    isSolid(x, y){
      const t = this.get(x,y);
      return t !== this.Types.EMPTY && t !== this.Types.CHEST && t !== this.Types.OPEN_CHEST;
    }
  }

  class Player {
    constructor(world){
      this.world = world;
      this.width = 20; // Hitbox menor que tile
      this.height = 28;
      this.x = world.width * TILE_SIZE / 2;
      this.y = 2 * TILE_SIZE;
      this.vx = 0;
      this.vy = 0;
      this.grounded = false;
      this.facing = 1; // 1 right, -1 left
      this.energy = 100;
      this.inventory = { carvao:0, ferro:0, ouro:0, diamante:0, bau:0 };
      this.pickaxeLevel = 1;
      this.cards = [];
      this.miningTimer = 0;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    update(dt){
      // Movimento Horizontal
      if(Input.isDown('KeyA') || Input.isDown('ArrowLeft')){
        this.vx -= MOVE_ACCEL * dt;
        this.facing = -1;
      } else if(Input.isDown('KeyD') || Input.isDown('ArrowRight')){
        this.vx += MOVE_ACCEL * dt;
        this.facing = 1;
      } else {
        // Atrito
        this.vx *= Math.pow(FRICTION, dt * 60);
      }

      // Clamp velocidade
      if(this.vx > MOVE_SPEED) this.vx = MOVE_SPEED;
      if(this.vx < -MOVE_SPEED) this.vx = -MOVE_SPEED;

      // Timers de Pulo
      if(this.grounded){
        this.coyoteTimer = 0.15;
      } else {
        this.coyoteTimer -= dt;
      }

      if(Input.isDown('Space') || Input.isDown('ArrowUp')){
        this.jumpBufferTimer = 0.15;
      } else {
        this.jumpBufferTimer -= dt;
      }

      // Pulo (com Coyote e Buffer)
      if(this.jumpBufferTimer > 0 && this.coyoteTimer > 0){
        this.vy = JUMP_FORCE;
        this.grounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
      }

      // Altura variável do pulo (soltar botão)
      if(this.vy < 0 && !(Input.isDown('Space') || Input.isDown('ArrowUp'))){
        this.vy += GRAVITY * dt * 2; // gravidade extra ao soltar
      }

      // Gravidade
      this.vy += GRAVITY * dt;
      if(this.vy > 800) this.vy = 800; // Terminal velocity

      // Aplicar Velocidade
      this.x += this.vx * dt;
      this.checkCollisionX();
      this.y += this.vy * dt;
      this.checkCollisionY();

      // Limites do mundo
      if(this.x < 0) this.x = 0;
      if(this.x > this.world.width*TILE_SIZE - this.width) this.x = this.world.width*TILE_SIZE - this.width;

      // Interação Baú (Automática ao tocar)
      this.checkChestInteraction();

      // Recuperar Energia na superfície
      if(this.y < 5 * TILE_SIZE && this.energy < 100){
        this.energy += 10 * dt;
        if(this.energy > 100) this.energy = 100;
      }
    }

    checkCollisionX(){
      const startX = Math.floor(this.x / TILE_SIZE);
      const endX = Math.floor((this.x + this.width) / TILE_SIZE);
      const startY = Math.floor(this.y / TILE_SIZE);
      const endY = Math.floor((this.y + this.height - 0.1) / TILE_SIZE);

      for(let y=startY; y<=endY; y++){
        for(let x=startX; x<=endX; x++){
          if(this.world.isSolid(x,y)){
            if(this.vx > 0){
              this.x = x * TILE_SIZE - this.width - 0.01;
              this.vx = 0;
            } else if(this.vx < 0){
              this.x = (x+1) * TILE_SIZE + 0.01;
              this.vx = 0;
            }
          }
        }
      }
    }

    checkCollisionY(){
      const startX = Math.floor(this.x / TILE_SIZE);
      const endX = Math.floor((this.x + this.width) / TILE_SIZE);
      const startY = Math.floor(this.y / TILE_SIZE);
      const endY = Math.floor((this.y + this.height) / TILE_SIZE);

      this.grounded = false;
      for(let y=startY; y<=endY; y++){
        for(let x=startX; x<=endX; x++){
          if(this.world.isSolid(x,y)){
            if(this.vy > 0){
              this.y = y * TILE_SIZE - this.height - 0.01;
              this.vy = 0;
              this.grounded = true;
            } else if(this.vy < 0){
              this.y = (y+1) * TILE_SIZE + 0.01;
              this.vy = 0;
            }
          }
        }
      }
    }

    checkChestInteraction(){
      const cx = this.x + this.width/2;
      const cy = this.y + this.height/2;
      const tx = Math.floor(cx / TILE_SIZE);
      const ty = Math.floor(cy / TILE_SIZE);
      if(this.world.get(tx,ty) === this.world.Types.CHEST){
        this.world.set(tx,ty, this.world.Types.OPEN_CHEST);
        Game.foundChest(tx,ty);
      }
    }
  }

  // --- Game Loop e Controle Geral ---
  const Game = {
    lastTime: 0,
    running: false,
    paused: false,
    sprites: new SpriteManager(),
    world: null,
    player: null,
    camera: { x: 0, y: 0 },
    particles: [],
    shake: 0,
    parallax: null,
    lightCanvas: document.createElement('canvas'),
    lightSprite: null,

    // Lista de fatos embaralhada
    factsDeck: [],

    init(){
      this.lightCanvas.width = CANVAS.width;
      this.lightCanvas.height = CANVAS.height;
      this.parallax = new Parallax(CANVAS.width, CANVAS.height);

      // Pre-render light
      this.lightSprite = document.createElement('canvas');
      this.lightSprite.width = 256; this.lightSprite.height = 256;
      const lctx = this.lightSprite.getContext('2d');
      const g = lctx.createRadialGradient(128,128,0, 128,128,128);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.fillRect(0,0,256,256);

      this.world = new World(WORLD_WIDTH, WORLD_HEIGHT);
      this.player = new Player(this.world);
      Input.init();

      this.factsDeck = [...ARCHAEOLOGY_FACTS].sort(() => Math.random() - 0.5);

      UI.btns.start.addEventListener('click', () => this.start());
      UI.btns.upgradeOpen.addEventListener('click', () => this.toggleUpgrade());
      UI.btns.upgradeClose.addEventListener('click', () => this.toggleUpgrade());
      UI.btns.upgradeAction.addEventListener('click', () => this.buyUpgrade());
      UI.btns.surface.addEventListener('click', () => this.toSurface());
      UI.btns.cardClose.addEventListener('click', () => { UI.screens.card.classList.add('hidden'); this.paused = false; });

      this.updateHUD();
      this.draw(0); // Desenhar tela inicial (fundo)
    },

    start(){
      UI.screens.start.classList.add('hidden');
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame(t => this.loop(t));
    },

    togglePause(){
      if(UI.screens.start.classList.contains('hidden') === false) return;
      this.paused = !this.paused;
      UI.screens.pause.classList.toggle('hidden', !this.paused);
    },

    toSurface(){
      this.player.x = (this.world.width * TILE_SIZE) / 2;
      this.player.y = 2 * TILE_SIZE;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.energy = 100;
    },

    toggleUpgrade(){
      if(this.player.y > 6 * TILE_SIZE && UI.screens.upgrade.classList.contains('hidden')) return; // Só na superfície para abrir

      if(UI.screens.upgrade.classList.contains('hidden')){
        UI.screens.upgrade.classList.remove('hidden');
        this.paused = true;
        this.refreshUpgradeUI();
      } else {
        UI.screens.upgrade.classList.add('hidden');
        this.paused = false;
      }
    },

    refreshUpgradeUI(){
      UI.texts.upgradeCurrent.textContent = this.player.pickaxeLevel;
      const c = this.getUpgradeCost();
      UI.texts.upgradeCost.innerHTML = `Ferro: ${c.ferro} | Ouro: ${c.ouro} | Diamante: ${c.diamante}`;
    },

    getUpgradeCost(){
      const l = this.player.pickaxeLevel;
      return {
        ferro: l * 5,
        ouro: l * 2,
        diamante: Math.floor(l/2)
      };
    },

    buyUpgrade(){
      const cost = this.getUpgradeCost();
      const inv = this.player.inventory;
      if(inv.ferro >= cost.ferro && inv.ouro >= cost.ouro && inv.diamante >= cost.diamante){
        inv.ferro -= cost.ferro;
        inv.ouro -= cost.ouro;
        inv.diamante -= cost.diamante;
        this.player.pickaxeLevel++;
        this.refreshUpgradeUI();
        this.updateHUD();
      }
    },

    foundChest(tx, ty){
      // Efeito e Recompensa
      this.player.inventory.bau++;

      // Popup Card
      this.paused = true;
      let text = "Você encontrou todos os segredos desta área!";
      if(this.factsDeck.length > 0){
        text = this.factsDeck.pop();
      }
      UI.texts.card.textContent = text;
      UI.screens.card.classList.remove('hidden');
      UI.inv.cards.textContent = `${ARCHAEOLOGY_FACTS.length - this.factsDeck.length}/${ARCHAEOLOGY_FACTS.length}`;
      this.updateHUD();

      // Partículas
      for(let i=0; i<20; i++){
        this.particles.push({
          x: tx*TILE_SIZE + TILE_SIZE/2,
          y: ty*TILE_SIZE + TILE_SIZE/2,
          vx: (Math.random()-0.5)*300,
          vy: (Math.random()-0.5)*300,
          life: 1.0,
          color: '#ffd700'
        });
      }
    },

    mine(dt){
      // Lógica de mineração com Mouse
      if(Input.mouse.left){
        const mx = Input.mouse.x + this.camera.x;
        const my = Input.mouse.y + this.camera.y;

        const tx = Math.floor(mx / TILE_SIZE);
        const ty = Math.floor(my / TILE_SIZE);

        // Distância
        const pcx = this.player.x + this.player.width/2;
        const pcy = this.player.y + this.player.height/2;
        const dist = Math.sqrt( Math.pow(mx - pcx, 2) + Math.pow(my - pcy, 2) );

        if(dist < TILE_SIZE * 3){ // Alcance
          const tile = this.world.get(tx,ty);
          if(tile !== this.world.Types.EMPTY && tile !== this.world.Types.BEDROCK && tile !== this.world.Types.CHEST){
            // Tempo de quebra
            const speed = 1 + (this.player.pickaxeLevel * 0.5);
            let hardness = 1;
            if(tile === this.world.Types.STONE) hardness = 2;
            if(tile === this.world.Types.DIAMOND) hardness = 4;

            this.player.miningTimer += dt * speed;
            if(this.player.miningTimer > hardness * 0.2){
              // Quebrou
              this.player.miningTimer = 0;
              this.world.set(tx,ty, this.world.Types.EMPTY);
              this.collectDrop(tile);
              this.spawnDebris(tx,ty, tile);
              this.player.energy -= 0.5; // Custo energia
              this.shake = 3;
            }
          }
        }
      } else {
        this.player.miningTimer = 0;
      }
    },

    collectDrop(tile){
      const Types = this.world.Types;
      if(tile === Types.COAL) this.player.inventory.carvao++;
      if(tile === Types.IRON) this.player.inventory.ferro++;
      if(tile === Types.GOLD) this.player.inventory.ouro++;
      if(tile === Types.DIAMOND) this.player.inventory.diamante++;
      this.updateHUD();
    },

    spawnDebris(tx, ty, tile){
      for(let i=0; i<5; i++){
        this.particles.push({
          x: tx*TILE_SIZE + TILE_SIZE/2,
          y: ty*TILE_SIZE + TILE_SIZE/2,
          vx: (Math.random()-0.5)*150,
          vy: (Math.random()-0.5)*150,
          life: 0.5 + Math.random()*0.5,
          color: '#aaa' // Cor genérica, pode melhorar dps
        });
      }
    },

    updateHUD(){
      UI.depth.textContent = Math.floor(this.player.y / TILE_SIZE);
      UI.energy.textContent = Math.floor(this.player.energy);
      UI.energyFill.style.width = this.player.energy + '%';

      UI.inv.carvao.textContent = this.player.inventory.carvao;
      UI.inv.ferro.textContent = this.player.inventory.ferro;
      UI.inv.ouro.textContent = this.player.inventory.ouro;
      UI.inv.diamante.textContent = this.player.inventory.diamante;
      UI.inv.bau.textContent = this.player.inventory.bau;
      UI.pickaxe.textContent = 'Lv ' + this.player.pickaxeLevel;
    },

    loop(now){
      const dt = Math.min((now - this.lastTime) / 1000, 0.1); // Cap delta time
      this.lastTime = now;

      if(!this.paused){
        if(this.shake > 0) this.shake = Math.max(0, this.shake - dt * 10);
        this.player.update(dt);
        this.mine(dt);

        // Câmera segue jogador
        const targetCamX = this.player.x + this.player.width/2 - CANVAS.width/2;
        const targetCamY = this.player.y + this.player.height/2 - CANVAS.height/2;

        // Lerp
        this.camera.x += (targetCamX - this.camera.x) * 5 * dt;
        this.camera.y += (targetCamY - this.camera.y) * 5 * dt;

        // Clamp câmera no mundo
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.world.width*TILE_SIZE - CANVAS.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.world.height*TILE_SIZE - CANVAS.height));

        // Update Partículas
        for(let i=this.particles.length-1; i>=0; i--){
          const p = this.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += GRAVITY * dt; // gravidade nas partículas
          p.life -= dt;
          if(p.life <= 0) this.particles.splice(i,1);
        }

        this.updateHUD();
      }

      this.draw();
      requestAnimationFrame(t => this.loop(t));
    },

    draw(){
      // Limpar
      CTX.fillStyle = '#1a1f2b';
      CTX.fillRect(0,0, CANVAS.width, CANVAS.height);

      CTX.save();
      // Shake Effect
      if(this.shake > 0){
         CTX.translate((Math.random()-0.5)*this.shake, (Math.random()-0.5)*this.shake);
      }

      // Parallax
      if(this.parallax) this.parallax.draw(CTX, this.camera.x, this.camera.y);

      CTX.save();
      CTX.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

      // Viewport culling
      const startCol = Math.floor(this.camera.x / TILE_SIZE);
      const endCol = startCol + (CANVAS.width / TILE_SIZE) + 1;
      const startRow = Math.floor(this.camera.y / TILE_SIZE);
      const endRow = startRow + (CANVAS.height / TILE_SIZE) + 1;

      // Desenhar Mundo
      for(let y=startRow; y<=endRow; y++){
        for(let x=startCol; x<=endCol; x++){
          const t = this.world.get(x,y);
          if(t !== this.world.Types.EMPTY){
            let spriteName = 'dirt';
            if(t===this.world.Types.STONE) spriteName = 'stone';
            if(t===this.world.Types.COAL) spriteName = 'coal';
            if(t===this.world.Types.IRON) spriteName = 'iron';
            if(t===this.world.Types.GOLD) spriteName = 'gold';
            if(t===this.world.Types.DIAMOND) spriteName = 'diamond';
            if(t===this.world.Types.BEDROCK) spriteName = 'bedrock';
            if(t===this.world.Types.CHEST) spriteName = 'chest';
            if(t===this.world.Types.OPEN_CHEST) spriteName = 'open_chest';

            const img = this.sprites.get(spriteName);
            if(img) CTX.drawImage(img, x*TILE_SIZE, y*TILE_SIZE);
          } else {
             // Parede de fundo (mais escuro)
             if(y > 5){
               CTX.fillStyle = '#111';
               CTX.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
             }
          }
        }
      }

      // Desenhar Jogador
      CTX.fillStyle = '#5f94e9'; // Corpo
      CTX.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
      // Olhos (direção)
      CTX.fillStyle = '#fff';
      if(this.player.facing > 0){
        CTX.fillRect(this.player.x + 12, this.player.y + 6, 4, 4);
      } else {
        CTX.fillRect(this.player.x + 4, this.player.y + 6, 4, 4);
      }
      // Capacete
      CTX.fillStyle = '#e0b66a';
      CTX.fillRect(this.player.x - 2, this.player.y - 4, this.player.width+4, 8);

      // Partículas
      this.particles.forEach(p => {
        CTX.fillStyle = p.color;
        CTX.globalAlpha = p.life;
        CTX.fillRect(p.x, p.y, 3, 3);
        CTX.globalAlpha = 1.0;
      });

      CTX.restore(); // Restore camera

      this.renderLightMap();
      CTX.restore(); // Restore shake
    },

    spawnConfetti(){
      const layer = document.getElementById('confetti-global');
      const card = UI.screens.card.querySelector('.card');
      if(!layer || !card) return;
      layer.innerHTML='';

      const layerRect = layer.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const cx = cardRect.left + cardRect.width/2 - layerRect.left;
      const cy = cardRect.top + cardRect.height/2 - layerRect.top;

      const colors = ['#ff7b5b','#ffd84d','#7bffb8','#55d3dc','#ff9de6','#fff6c9','#ffe28a'];

      for(let i=0; i<80; i++){
        const el = document.createElement('div');
        let cls = 'confetti-piece';
        const r = Math.random();
        if(r<0.3) cls+=' round'; else if(r<0.55) cls+=' bar';
        el.className = cls;
        el.style.background = colors[Math.floor(Math.random()*colors.length)];

        const angle = Math.random()*Math.PI*2;
        const dist = 40 + Math.random()*150;
        const dx = Math.cos(angle)*dist;
        const dy = Math.sin(angle)*dist;

        el.style.left = cx+'px';
        el.style.top = cy+'px';
        el.style.setProperty('--dx', dx.toFixed(2)+'px');
        el.style.setProperty('--dy', dy.toFixed(2)+'px');
        el.style.setProperty('--rot', (Math.random()*720 - 360).toFixed(1)+'deg');

        const dur = (0.85 + Math.random()*0.5).toFixed(2)+'s';
        el.style.animation = `confettiBurst ${dur} cubic-bezier(.25,.6,.35,1) forwards`;
        el.style.animationDelay = (Math.random()*0.06).toFixed(2)+'s';

        layer.appendChild(el);
      }
      setTimeout(()=>{ layer.innerHTML=''; }, 2000);
    },

    renderLightMap(){
      const lctx = this.lightCanvas.getContext('2d');
      lctx.globalCompositeOperation = 'source-over';
      const playerDepth = this.player.y / TILE_SIZE;
      let darkness = 0;
      if(playerDepth > 5) darkness = Math.min(0.95, (playerDepth - 5) * 0.08);

      if(darkness <= 0.05) return;

      lctx.fillStyle = `rgba(0,0,0,${darkness})`;
      lctx.fillRect(0,0,CANVAS.width, CANVAS.height);

      lctx.globalCompositeOperation = 'destination-out';

      // Player Light
      const px = this.player.x + this.player.width/2 - this.camera.x;
      const py = this.player.y + this.player.height/2 - this.camera.y;

      const flicker = Math.random() * 2;
      const pRadius = 450 + flicker; // Size of drawImage
      lctx.drawImage(this.lightSprite, px - pRadius/2, py - pRadius/2, pRadius, pRadius);

      // Ores/Chest Light
      const startCol = Math.floor(this.camera.x / TILE_SIZE);
      const endCol = startCol + (CANVAS.width / TILE_SIZE) + 1;
      const startRow = Math.floor(this.camera.y / TILE_SIZE);
      const endRow = startRow + (CANVAS.height / TILE_SIZE) + 1;

      for(let y=startRow; y<=endRow; y++){
        for(let x=startCol; x<=endCol; x++){
          const t = this.world.get(x,y);
          if(t === this.world.Types.GOLD || t === this.world.Types.DIAMOND || t === this.world.Types.OPEN_CHEST){
             const tx = x*TILE_SIZE + TILE_SIZE/2 - this.camera.x;
             const ty = y*TILE_SIZE + TILE_SIZE/2 - this.camera.y;
             const size = 120 + Math.random()*5;
             lctx.drawImage(this.lightSprite, tx - size/2, ty - size/2, size, size);
          }
        }
      }

      CTX.drawImage(this.lightCanvas, 0, 0);
    }
  };

  Game.init();
})();
