const form = document.getElementById("recipe-form");
const summaryEl = document.getElementById("summary");
const detailsEl = document.getElementById("details");

const basketProfiles = {
  small: {
    label: "Pequeña (14-16 g)",
    ratio: 0.85,
    minDose: 14,
    maxDose: 16,
    note:
      "Las cestas pequeñas necesitan más espacio libre para evitar sobrepresión, así que cuida no saturar la canasta.",
  },
  medium: {
    label: "Media (18 g)",
    ratio: 1,
    minDose: 17,
    maxDose: 19,
    note:
      "Las canastas de 18 g suelen rendir mejor cerca de su capacidad nominal, manteniendo la cama uniforme.",
  },
  large: {
    label: "Grande (20-22 g)",
    ratio: 1.17,
    minDose: 20,
    maxDose: 22,
    note:
      "Las canastas de mayor volumen aprovechan mejor dosis de 20-22 g, lo que facilita una distribución homogénea.",
  },
};

const accessoryEffects = {
  "top-screen": {
    grind: 0.6,
    doseDelta: -0.4,
    timeDelta: 1,
    note:
      "Un puck screen superior añade resistencia y reduce el headspace; abrir ligeramente la molienda y recortar cerca de 0.5 g ayuda a compensarlo.",
  },
  "bottom-screen": {
    grind: 0.7,
    timeDelta: 1.5,
    note:
      "Un puck screen inferior actúa como filtro adicional, alargando el flujo y pidiendo una molienda un poco más gruesa.",
  },
  "paper-top": {
    grind: 0.3,
    doseDelta: -0.3,
    note:
      "Un filtro de papel sobre la cama absorbe parte del headspace y suaviza la turbulencia inicial; suele funcionar bajar ligeramente la dosis y abrir un toque la molienda.",
  },
  "paper-bottom": {
    grind: 0.8,
    ratioMultiplier: 1.03,
    timeDelta: 2.5,
    note:
      "Un filtro de papel bajo la cama mejora la uniformidad pero también la resistencia; moler más grueso y permitir unos segundos extra equilibra el tiro.",
  },
};

const transitionRules = [
  {
    id: "machine_home_to_prosumer",
    applies: (current, target) =>
      current.machine === "home" && target.machine === "prosumer",
    effect: {
      grind: -1.2,
      note:
        "Las máquinas prosumer mantienen caudal y temperatura más estables, por lo que suele ser necesario cerrar la molienda para sostener el tiempo objetivo.",
    },
  },
  {
    id: "machine_prosumer_to_home",
    applies: (current, target) =>
      current.machine === "prosumer" && target.machine === "home",
    effect: {
      grind: 1.1,
      timeDelta: -2,
      note:
        "Al pasar a una máquina casera se pierde presión consistente; abre un poco la molienda y acepta tiros algo más cortos para evitar channelling.",
    },
  },
  {
    id: "machine_home_to_lever",
    applies: (current, target) =>
      current.machine === "home" && target.machine === "lever",
    effect: {
      grind: -0.6,
      timeDelta: 1.5,
      note:
        "Los grupos de palanca facilitan una preinfusión natural, así que se puede cerrar ligeramente la molienda y permitir un poco más de tiempo.",
    },
  },
  {
    id: "machine_lever_to_home",
    applies: (current, target) =>
      current.machine === "lever" && target.machine === "home",
    effect: {
      grind: 0.6,
      timeDelta: -1.5,
      note:
        "Al volver de una máquina de palanca a una casera sin preinfusión conviene abrir un poco la molienda y recortar tiempos para mantener el balance.",
    },
  },
  {
    id: "basket_standard_to_precision",
    applies: (current, target) =>
      current.basketType === "standard" && target.basketType === "precision",
    effect: {
      grind: -0.8,
      note:
        "Las canastas de precisión tienen agujeros uniformes que aceleran el flujo, por lo que conviene moler más fino para recuperar la resistencia.",
    },
  },
  {
    id: "basket_precision_to_standard",
    applies: (current, target) =>
      current.basketType === "precision" && target.basketType === "standard",
    effect: {
      grind: 0.8,
      note:
        "Al pasar de una canasta de precisión a una estándar el flujo se frena; abrir la molienda ayuda a evitar sobreextracción desigual.",
    },
  },
  {
    id: "grinder_entry_to_pro",
    applies: (current, target) =>
      current.grinder === "entry" && target.grinder === "pro",
    effect: {
      grind: -0.9,
      ratioMultiplier: 1.05,
      note:
        "Los molinos de alta precisión permiten extraer más de forma uniforme, por lo que se puede cerrar la molienda y aumentar ligeramente el rendimiento.",
    },
  },
  {
    id: "grinder_entry_to_mid",
    applies: (current, target) =>
      current.grinder === "entry" && target.grinder === "mid",
    effect: {
      grind: -0.5,
      ratioMultiplier: 1.02,
      note:
        "Con un molino intermedio hay menos finos, así que puedes moler algo más fino y apuntar a un 2-3 % más de rendimiento para lograr una taza más clara.",
    },
  },
  {
    id: "grinder_mid_to_pro",
    applies: (current, target) =>
      current.grinder === "mid" && target.grinder === "pro",
    effect: {
      grind: -0.4,
      ratioMultiplier: 1.03,
      note:
        "Al pasar a muelas de alta precisión se gana uniformidad; cierra un poco la molienda y permite un ligero aumento del rendimiento.",
    },
  },
  {
    id: "grinder_pro_to_entry",
    applies: (current, target) =>
      current.grinder === "pro" && target.grinder === "entry",
    effect: {
      grind: 0.9,
      ratioMultiplier: 0.96,
      timeDelta: -2,
      note:
        "Si bajas a un molino con más variación, conviene abrir la molienda y reducir el rendimiento para evitar sabores amargos.",
    },
  },
  {
    id: "grinder_mid_to_entry",
    applies: (current, target) =>
      current.grinder === "mid" && target.grinder === "entry",
    effect: {
      grind: 0.5,
      ratioMultiplier: 0.97,
      note:
        "Molinos de entrada generan más finos; abrir un poco la molienda y recortar el rendimiento ayuda a mantener claridad.",
    },
  },
  {
    id: "preinfusion_none_to_short",
    applies: (current, target) =>
      current.preinfusion === "none" && target.preinfusion === "short",
    effect: {
      grind: -0.5,
      timeDelta: 2,
      note:
        "Una preinfusión corta hidrata la cama antes del flujo fuerte; cierra ligeramente la molienda y permite dos segundos extra de extracción controlada.",
    },
  },
  {
    id: "preinfusion_none_to_long",
    applies: (current, target) =>
      current.preinfusion === "none" && target.preinfusion === "long",
    effect: {
      grind: -0.9,
      timeDelta: 4,
      note:
        "Las preinfusiones largas homogenizan la cama, permitiendo moler bastante más fino y extender el tiempo total unos segundos sin sobreextraer.",
    },
  },
  {
    id: "preinfusion_short_to_none",
    applies: (current, target) =>
      current.preinfusion === "short" && target.preinfusion === "none",
    effect: {
      grind: 0.5,
      timeDelta: -2,
      note:
        "Si eliminas la preinfusión corta, abre la molienda y reduce el tiempo para evitar channeling.",
    },
  },
  {
    id: "preinfusion_long_to_none",
    applies: (current, target) =>
      current.preinfusion === "long" && target.preinfusion === "none",
    effect: {
      grind: 0.9,
      timeDelta: -4,
      note:
        "Al quitar una preinfusión larga, abre bastante la molienda y vuelve a tiempos más breves para mantener el balance.",
    },
  },
  {
    id: "preinfusion_short_to_long",
    applies: (current, target) =>
      current.preinfusion === "short" && target.preinfusion === "long",
    effect: {
      grind: -0.4,
      timeDelta: 2,
      note:
        "Extender la preinfusión favorece la uniformidad, así que puedes cerrar un poco más la molienda y dejar correr dos segundos adicionales.",
    },
  },
];

function getFormState() {
  const baseDose = parseFloat(form.dose.value) || 0;
  const baseYield = parseFloat(form.yield.value) || 0;
  const baseTime = parseFloat(form.time.value) || 0;

  const getAccessories = (scope) =>
    Array.from(form.querySelectorAll(`input[name="${scope}-accessory"]:checked`)).map(
      (input) => input.value
    );

  return {
    base: {
      dose: baseDose,
      yield: baseYield,
      time: baseTime,
    },
    current: {
      machine: form["current-machine"].value,
      basket: form["current-basket"].value,
      basketType: form["current-basket-type"].value,
      grinder: form["current-grinder"].value,
      preinfusion: form["current-preinfusion"].value,
      accessories: getAccessories("current"),
    },
    target: {
      machine: form["target-machine"].value,
      basket: form["target-basket"].value,
      basketType: form["target-basket-type"].value,
      grinder: form["target-grinder"].value,
      preinfusion: form["target-preinfusion"].value,
      accessories: getAccessories("target"),
    },
  };
}

const metricIcons = {
  Dosis: "⚖️",
  Rendimiento: "🥤",
  Tiempo: "⏱️",
  "Relación": "🔁",
};

function computeRecommendations(state) {
  const total = {
    grindSteps: 0,
    doseDelta: 0,
    yieldDelta: 0,
    timeDelta: 0,
    ratioMultiplier: 1,
    notes: [],
  };

  const applyEffect = (effect, label) => {
    if (!effect) return;
    if (typeof effect.grind === "number") total.grindSteps += effect.grind;
    if (typeof effect.doseDelta === "number") total.doseDelta += effect.doseDelta;
    if (typeof effect.yieldDelta === "number") total.yieldDelta += effect.yieldDelta;
    if (typeof effect.timeDelta === "number") total.timeDelta += effect.timeDelta;
    if (typeof effect.ratioMultiplier === "number")
      total.ratioMultiplier *= effect.ratioMultiplier;
    if (effect.note) total.notes.push({ text: effect.note, label });
  };

  const currentProfile = basketProfiles[state.current.basket];
  const targetProfile = basketProfiles[state.target.basket];

  if (currentProfile && targetProfile && state.base.dose) {
    const projectedDose =
      state.base.dose * (targetProfile.ratio / currentProfile.ratio);
    const clampedDose = clamp(
      projectedDose,
      targetProfile.minDose,
      targetProfile.maxDose
    );
    const doseDelta = clampedDose - state.base.dose;
    if (Math.abs(doseDelta) >= 0.1) {
      applyEffect(
        {
          doseDelta,
          note: `${targetProfile.note} Ajusta la dosis hacia ${clampedDose.toFixed(
            1
          )} g para llenar correctamente la nueva canasta.`,
        },
        "Canasta"
      );
    }
  }

  transitionRules.forEach((rule) => {
    if (rule.applies(state.current, state.target)) {
      applyEffect(rule.effect, rule.id);
    }
  });

  const currentAccessories = new Set(state.current.accessories);
  const targetAccessories = new Set(state.target.accessories);

  targetAccessories.forEach((item) => {
    if (!currentAccessories.has(item)) {
      const effect = accessoryEffects[item];
      applyEffect(effect, `Añadir ${item}`);
    }
  });

  currentAccessories.forEach((item) => {
    if (!targetAccessories.has(item)) {
      const effect = accessoryEffects[item];
      if (effect) {
        const inverse = invertEffect(effect);
        applyEffect(inverse, `Retirar ${item}`);
      }
    }
  });

  const recommendedDose = clamp(
    state.base.dose + total.doseDelta,
    5,
    30
  );
  const baseYieldAdjusted = state.base.yield + total.yieldDelta;
  const recommendedYield = clamp(
    baseYieldAdjusted * total.ratioMultiplier,
    5,
    80
  );
  const recommendedTime = clamp(state.base.time + total.timeDelta, 5, 60);

  const baseRatio = safeRatio(state.base.yield, state.base.dose);
  const newRatio = safeRatio(recommendedYield, recommendedDose);

  return {
    total,
    base: state.base,
    recommended: {
      dose: recommendedDose,
      yield: recommendedYield,
      time: recommendedTime,
      ratio: newRatio,
    },
    baseRatio,
  };
}

function invertEffect(effect) {
  const inverse = {};
  if (typeof effect.grind === "number") inverse.grind = -effect.grind;
  if (typeof effect.doseDelta === "number") inverse.doseDelta = -effect.doseDelta;
  if (typeof effect.yieldDelta === "number") inverse.yieldDelta = -effect.yieldDelta;
  if (typeof effect.timeDelta === "number") inverse.timeDelta = -effect.timeDelta;
  if (typeof effect.ratioMultiplier === "number")
    inverse.ratioMultiplier = 1 / effect.ratioMultiplier;
  if (effect.note)
    inverse.note = `Al retirar este accesorio, invierte la recomendación: ${effect.note}`;
  return inverse;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function safeRatio(yieldValue, doseValue) {
  if (!yieldValue || !doseValue) return 0;
  return yieldValue / doseValue;
}

function formatDelta(delta, unit, precision = 1) {
  const threshold = precision >= 2 ? 0.01 : 0.05;
  if (Number.isNaN(delta) || Math.abs(delta) < threshold) {
    return { text: "", type: "neutral" };
  }
  const text = `${delta > 0 ? "+" : ""}${delta.toFixed(precision)} ${unit}`;
  return { text, type: delta > 0 ? "positive" : "negative" };
}

function formatRatioDisplay(value) {
  if (!value || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)} : 1`;
}

function describeGrind(steps) {
  if (Math.abs(steps) < 0.35) {
    return {
      label: "Sin cambios grandes",
      detail: "Mantén el punto de molienda",
      direction: "neutral",
    };
  }
  if (steps <= -1.5) {
    return {
      label: "Mucho más fino",
      detail: "Cierra notablemente la molienda; en un molino escalonado equivale a 2-3 clics",
      direction: "finer",
    };
  }
  if (steps < -0.8) {
    return {
      label: "Más fino",
      detail: "Cierra la molienda alrededor de 1 clic o un ajuste pequeño en molino continuo",
      direction: "finer",
    };
  }
  if (steps < -0.35) {
    return {
      label: "Ligeramente más fino",
      detail: "Haz un micro ajuste hacia lo fino",
      direction: "finer",
    };
  }
  if (steps >= 1.5) {
    return {
      label: "Mucho más grueso",
      detail: "Abre la molienda 2-3 clics para compensar la resistencia extra",
      direction: "coarser",
    };
  }
  if (steps > 0.8) {
    return {
      label: "Más grueso",
      detail: "Abre aproximadamente 1 clic en un molino escalonado",
      direction: "coarser",
    };
  }
  return {
    label: "Ligeramente más grueso",
    detail: "Haz un micro ajuste hacia lo grueso",
    direction: "coarser",
  };
}

function renderRecommendations(result) {
  const { base, baseRatio, recommended, total } = result;

  if (
    Math.abs(total.doseDelta) < 0.05 &&
    Math.abs(total.timeDelta) < 0.1 &&
    Math.abs(total.yieldDelta) < 0.1 &&
    Math.abs(total.grindSteps) < 0.2 &&
    Math.abs(total.ratioMultiplier - 1) < 0.01
  ) {
    summaryEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">☕</span>
        <h3>Sin cambios detectados</h3>
        <p>Selecciona un ajuste de equipo o modifica tu receta base para obtener recomendaciones.</p>
      </div>
    `;
    detailsEl.innerHTML = "";
    return;
  }

  const grindInfo = describeGrind(total.grindSteps);
  const grindClasses = ["grind-card"];
  if (grindInfo.direction && grindInfo.direction !== "neutral") {
    grindClasses.push(`grind-${grindInfo.direction}`);
  }

  const ratioDelta =
    baseRatio > 0 && recommended.ratio > 0
      ? formatDelta(recommended.ratio - baseRatio, "pts", 2)
      : { text: "", type: "neutral" };

  const rows = [
    {
      label: "Dosis",
      base: `${base.dose.toFixed(1)} g`,
      recommended: `${recommended.dose.toFixed(1)} g`,
      delta: formatDelta(recommended.dose - base.dose, "g"),
    },
    {
      label: "Rendimiento",
      base: `${base.yield.toFixed(1)} g`,
      recommended: `${recommended.yield.toFixed(1)} g`,
      delta: formatDelta(recommended.yield - base.yield, "g"),
    },
    {
      label: "Tiempo",
      base: `${base.time.toFixed(1)} s`,
      recommended: `${recommended.time.toFixed(1)} s`,
      delta: formatDelta(recommended.time - base.time, "s"),
    },
    {
      label: "Relación",
      base: formatRatioDisplay(baseRatio),
      recommended: formatRatioDisplay(recommended.ratio),
      delta: ratioDelta,
    },
  ];

  const summaryHtml = `
    <div class="${grindClasses.join(" ")}">
      <div class="grind-icon" aria-hidden="true">⚙️</div>
      <div>
        <h3>${grindInfo.label}</h3>
        <p>${grindInfo.detail}</p>
      </div>
    </div>
    <div class="metric-grid">
      ${rows
        .map((row) => {
          const delta = row.delta;
          return `
            <article class="metric-card">
              <header>
                <span class="metric-icon" aria-hidden="true">${
                  metricIcons[row.label] || "☕"
                }</span>
                <span class="metric-name">${row.label}</span>
              </header>
              <div class="metric-values">
                <div>
                  <span class="metric-caption">Base</span>
                  <strong>${row.base}</strong>
                </div>
                <div>
                  <span class="metric-caption">Propuesta</span>
                  <strong>${row.recommended}</strong>
                </div>
              </div>
              ${
                delta.text
                  ? `<p class="metric-delta delta-${delta.type}">${delta.text}</p>`
                  : ""
              }
            </article>
          `;
        })
        .join("")}
    </div>
  `;

  summaryEl.innerHTML = summaryHtml;

  if (total.notes.length) {
    const notesHtml = `
      <h3>¿Por qué sugerimos esto?</h3>
      <ul>
        ${total.notes
          .map(
            (note) =>
              `<li><span class="note-icon" aria-hidden="true">💡</span><span>${note.text}</span></li>`
          )
          .join("")}
      </ul>
    `;
    detailsEl.innerHTML = notesHtml;
  } else {
    detailsEl.innerHTML = "";
  }
}

function update() {
  const state = getFormState();
  const recommendations = computeRecommendations(state);
  renderRecommendations(recommendations);
}

form.addEventListener("input", update);
form.addEventListener("change", update);

document.addEventListener("DOMContentLoaded", update);

update();
