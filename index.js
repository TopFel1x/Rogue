class Game {
  constructor(width = 40, height = 24) {
    this.width = width
    this.height = height
    this.map = []
    this.enemies = []

    this.hero = {
      x: 0,
      y: 0,
      hp: 100,
      attack: 1,
    }

    this.init()
  }

  init() {
    this.generateMap()
    this.placeAll()
    this.enemyAttackHero()
    this.renderMap()
  }

  generateMap() {
    this.map = Array.from({ length: this.height }, () =>
      Array(this.width).fill("W")
    )
  }

  placeAll() {
    this.placeRooms()
    this.placePassages()
    this.placeItems()
    this.placeHero()
    this.placeEnemies()
  }

  placeRooms() {
    for (let i = 0; i < this.randomInt(5, 10); i++) {
      const w = this.randomInt(3, 8)
      const h = this.randomInt(3, 8)
      const { x, y } = this.getRandomCoords(this.width - w, this.height - h)

      this.forEachInArea(x, y, w, h, (xx, yy) => this.setTile(xx, yy, "R"))
    }
  }

  placePassages() {
    for (let i = 0; i < this.randomInt(3, 5); i++) {
      const { x, y } = this.getRandomCoords()
      for (let xx = 0; xx < this.width; xx++) this.setTile(xx, y, "R")
      for (let yy = 0; yy < this.height; yy++) this.setTile(x, yy, "R")
    }
  }

  placeItems() {
    let swords = 0,
      potions = 0
    while (swords < 2 || potions < 10) {
      const { x, y } = this.getRandomCoords()
      if (this.getTile(x, y) !== "R") continue

      if (swords < 2) {
        this.setTile(x, y, "SW")
        swords++
      } else {
        this.setTile(x, y, "HP")
        potions++
      }
    }
  }

  placeHero() {
    while (true) {
      const { x, y } = this.getRandomCoords()
      if (this.getTile(x, y) === "R") {
        this.setTile(x, y, "P")
        this.hero.x = x
        this.hero.y = y
        break
      }
    }
  }

  placeEnemies() {
    let count = 0
    while (count < 10) {
      const { x, y } = this.getRandomCoords()
      if (this.getTile(x, y) === "R") {
        this.setTile(x, y, "E")
        this.enemies.push({ x, y, hp: 3 })
        count++
      }
    }
  }

  moveHero(direction) {
    const deltas = { w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }
    const [dx, dy] = deltas[direction] || [0, 0]
    const nx = this.hero.x + dx,
      ny = this.hero.y + dy

    if (
      !this.inBounds(nx, ny) ||
      this.getTile(nx, ny) === "W" ||
      this.getTile(nx, ny) === "E"
    )
      return

    const tile = this.getTile(nx, ny)
    if (tile === "HP") this.hero.hp += 10
    if (tile === "SW") this.hero.attack += 1

    this.setTile(this.hero.x, this.hero.y, "R")
    this.setTile(nx, ny, "P")
    Object.assign(this.hero, { x: nx, y: ny })

    this.moveEnemies()
    this.enemyAttackHero()
    this.renderMap()
  }

  attackEnemies() {
    for (const [dx, dy] of this.getDirections()) {
      const x = this.hero.x + dx,
        y = this.hero.y + dy
      if (!this.inBounds(x, y) || this.getTile(x, y) !== "E") continue

      const enemy = this.getEnemyAt(x, y)
      if (!enemy) continue

      enemy.hp -= this.hero.attack
      if (enemy.hp <= 0) {
        this.setTile(x, y, "R")
        this.enemies = this.enemies.filter((e) => e !== enemy)
      }
    }

    if (this.enemies.length === 0) {
      alert("Победа! Все враги повержены!")
      location.reload()
    }

    this.renderMap()
  }

  moveEnemies() {
    for (const enemy of this.enemies) {
      const [dx, dy] = this.getDirections()[this.randomInt(0, 3)]
      const nx = enemy.x + dx,
        ny = enemy.y + dy
      const target = this.getTile(nx, ny)

      if (this.inBounds(nx, ny) && target === "R") {
        this.setTile(enemy.x, enemy.y, "R")
        this.setTile(nx, ny, "E")
        Object.assign(enemy, { x: nx, y: ny })
      }
    }
  }

  enemyAttackHero() {
    for (const [dx, dy] of this.getDirections()) {
      const x = this.hero.x + dx,
        y = this.hero.y + dy
      if (this.inBounds(x, y) && this.getTile(x, y) === "E") {
        this.hero.hp -= 10
        if (this.hero.hp <= 0) {
          alert("Вы проиграли! Герой погиб.")
          location.reload()
        }
        break
      }
    }
  }

  renderMap() {
    const $f = document.querySelector(".field")
    $f.innerHTML = ""

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        $f.append(this.renderTile(x, y))
      }
    }
  }

  renderTile(x, y) {
    const tile = this.getTile(x, y)
    const $el = document.createElement("div")
    $el.className = `tile ${this.getTileClass(tile)}`
    $el.style.top = `${y * 50}px`
    $el.style.left = `${x * 50}px`

    if (tile === "P") $el.append(this.renderHPBar(this.hero.hp, 100, true))
    if (tile === "E") {
      const e = this.getEnemyAt(x, y)
      if (e) $el.append(this.renderHPBar(e.hp, 3))
    }

    return $el
  }

  renderHPBar(hp, max, isHero = false) {
    const bar = document.createElement("div")
    bar.className = `hp-bar${isHero ? " hero" : ""}`
    bar.style.width = `${(hp / max) * 100}%`
    return bar
  }

  getTileClass(tile) {
    return (
      {
        W: "tileW",
        R: "tile",
        SW: "tileSW",
        HP: "tileHP",
        P: "tileP",
        E: "tileE",
      }[tile] || "tile"
    )
  }

  forEachInArea(x, y, w, h, cb) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        cb(xx, yy)
      }
    }
  }

  getRandomCoords(maxX = this.width - 1, maxY = this.height - 1) {
    return {
      x: this.randomInt(0, maxX),
      y: this.randomInt(0, maxY),
    }
  }

  getTile(x, y) {
    return this.map[y]?.[x] ?? "W"
  }

  setTile(x, y, value) {
    if (this.map[y]) this.map[y][x] = value
  }

  getEnemyAt(x, y) {
    return this.enemies.find((e) => e.x === x && e.y === y)
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height
  }

  getDirections() {
    return [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}

const game = new Game()

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase()
  if (["w", "a", "s", "d"].includes(k)) game.moveHero(k)
  if (e.code === "Space") game.attackEnemies()
})
