const form = document.getElementById("recipe-form");
const summaryEl = document.getElementById("summary");
const detailsEl = document.getElementById("details");

const knowledgeSources = {
  rao: {
    name: "Scott Rao",
    focus: "control del caudal y balance de extracción",
  },
  gagne: {
    name: "Jonathan Gagné",
    focus: "experimentos con accesorios y dinámica de flujo",
  },
  hustle: {
    name: "Barista Hustle",
    focus: "protocolos de dosis, ratios y consistencia",
  },
  research: {
    name: "estudios de extracción",
    focus: "evidencia publicada sobre resistencia y rendimiento",
  },
};

const machineLabels = {
  home: "Casera / Single boiler",
  prosumer: "Prosumer / Profesional",
  lever: "Palanca / Manual",
};

const basketCapacityLabels = {
  small: "Pequeña (14-16 g)",
  medium: "Media (18 g)",
  large: "Grande (20-22 g)",
};

const basketTypeLabels = {
  standard: "Estándar",
  precision: "Precisión",
};

const grinderLabels = {
  entry: "Básico / Saltos grandes",
  mid: "Intermedio",
  pro: "Muy preciso / SSP",
};

const preinfusionLabels = {
  none: "Sin preinfusión",
  short: "Corta 3-5 s",
  long: "Larga 8-12 s",
};

const accessoryLabels = {
  "top-screen": "puck screen superior",
  "bottom-screen": "puck screen inferior",
  "paper-top": "filtro de papel superior",
  "paper-bottom": "filtro de papel inferior",
};

const basketProfiles = {
  small: {
    label: "Pequeña (14-16 g)",
    ratio: 0.85,
    minDose: 14,
    maxDose: 16,
    sources: ["rao", "hustle"],
    note:
      "Scott Rao y Barista Hustle insisten en dejar un colchón de aire en canastas de 14-16 g para evitar sobrepresión.",
  },
  medium: {
    label: "Media (18 g)",
    ratio: 1,
    minDose: 17,
    maxDose: 19,
    sources: ["hustle"],
    note:
      "Barista Hustle documenta que las canastas de 18 g trabajan mejor cerca de su capacidad nominal para estabilizar la cama.",
  },
  large: {
    label: "Grande (20-22 g)",
    ratio: 1.17,
    minDose: 20,
    maxDose: 22,
    sources: ["gagne", "research"],
    note:
      "Jonathan Gagné y estudios de extracción muestran que canastas grandes se nivelan con dosis de 20-22 g y distribución homogénea.",
  },
};

const accessoryEffects = {
  "top-screen": {
    grind: 0.6,
    doseDelta: -0.4,
    timeDelta: 1,
    sources: ["gagne"],
    note:
      "Jonathan Gagné midió que un puck screen superior añade resistencia y reduce el headspace; abrir la molienda y recortar ~0.5 g compensa el flujo.",
  },
  "bottom-screen": {
    grind: 0.7,
    timeDelta: 1.5,
    sources: ["gagne", "research"],
    note:
      "Los ensayos de Gagné y datos publicados muestran que un puck screen inferior funciona como un filtro adicional que alarga el flujo, por eso conviene abrir la molienda.",
  },
  "paper-top": {
    grind: 0.3,
    doseDelta: -0.3,
    sources: ["gagne"],
    note:
      "Gagné reporta que un filtro de papel encima amortigua la turbulencia inicial; bajar un poco la dosis y abrir la molienda mantiene el margen de headspace.",
  },
  "paper-bottom": {
    grind: 0.8,
    ratioMultiplier: 1.03,
    timeDelta: 2.5,
    sources: ["gagne", "research"],
    note:
      "Las pruebas con filtros inferiores citadas por Gagné indican mayor uniformidad pero más resistencia; abrir la molienda y permitir unos segundos extra equilibra el tiro.",
  },
};

const transitionRules = [
  {
    id: "machine_home_to_prosumer",
    label: "Máquina casera → prosumer",
    applies: (current, target) =>
      current.machine === "home" && target.machine === "prosumer",
    effect: {
      grind: -1.2,
      sources: ["rao"],
      note:
        "Scott Rao explica que el caudal y la temperatura estables de una máquina prosumer piden cerrar la molienda para sostener el mismo tiempo.",
    },
  },
  {
    id: "machine_prosumer_to_home",
    label: "Máquina prosumer → casera",
    applies: (current, target) =>
      current.machine === "prosumer" && target.machine === "home",
    effect: {
      grind: 1.1,
      timeDelta: -2,
      sources: ["rao"],
      note:
        "Siguiendo a Rao, al volver a una máquina casera se pierde presión constante; abre la molienda y acepta tiros más cortos para controlar el channelling.",
    },
  },
  {
    id: "machine_home_to_lever",
    label: "Máquina casera → palanca",
    applies: (current, target) =>
      current.machine === "home" && target.machine === "lever",
    effect: {
      grind: -0.6,
      timeDelta: 1.5,
      sources: ["rao", "gagne"],
      note:
        "Rao y Gagné destacan que los grupos de palanca ofrecen preinfusión natural; cierra algo la molienda y deja correr un poco más de tiempo.",
    },
  },
  {
    id: "machine_lever_to_home",
    label: "Máquina de palanca → casera",
    applies: (current, target) =>
      current.machine === "lever" && target.machine === "home",
    effect: {
      grind: 0.6,
      timeDelta: -1.5,
      sources: ["rao"],
      note:
        "Rao advierte que al dejar una palanca desaparece la preinfusión suave; abre la molienda y recorta tiempo para mantener el balance.",
    },
  },
  {
    id: "basket_standard_to_precision",
    label: "Canasta estándar → precisión",
    applies: (current, target) =>
      current.basketType === "standard" && target.basketType === "precision",
    effect: {
      grind: -0.8,
      sources: ["rao", "hustle"],
      note:
        "Rao y Barista Hustle señalan que las canastas de precisión aceleran el flujo; moler más fino ayuda a recuperar resistencia.",
    },
  },
  {
    id: "basket_precision_to_standard",
    label: "Canasta precisión → estándar",
    applies: (current, target) =>
      current.basketType === "precision" && target.basketType === "standard",
    effect: {
      grind: 0.8,
      sources: ["rao", "hustle"],
      note:
        "Tanto Rao como Barista Hustle indican que las cestas estándar frenan el flujo; abre la molienda para evitar sobreextracción desigual.",
    },
  },
  {
    id: "grinder_entry_to_pro",
    label: "Molino básico → muy preciso",
    applies: (current, target) =>
      current.grinder === "entry" && target.grinder === "pro",
    effect: {
      grind: -0.9,
      ratioMultiplier: 1.05,
      sources: ["gagne", "rao"],
      note:
        "Gagné demuestra que los molinos de alta precisión generan menos finos y más uniformidad; Rao recomienda cerrar la molienda y permitir un rendimiento ligeramente mayor.",
    },
  },
  {
    id: "grinder_entry_to_mid",
    label: "Molino básico → intermedio",
    applies: (current, target) =>
      current.grinder === "entry" && target.grinder === "mid",
    effect: {
      grind: -0.5,
      ratioMultiplier: 1.02,
      sources: ["hustle"],
      note:
        "Barista Hustle muestra que al mejorar a un molino intermedio se reducen los finos; cierra un poco la molienda y apunta a 2-3 % más de rendimiento para mayor claridad.",
    },
  },
  {
    id: "grinder_mid_to_pro",
    label: "Molino intermedio → muy preciso",
    applies: (current, target) =>
      current.grinder === "mid" && target.grinder === "pro",
    effect: {
      grind: -0.4,
      ratioMultiplier: 1.03,
      sources: ["gagne"],
      note:
        "Gagné destaca que las muelas SSP aportan más uniformidad; cierra un poco la molienda y permite un ligero aumento del rendimiento.",
    },
  },
  {
    id: "grinder_pro_to_entry",
    label: "Molino muy preciso → básico",
    applies: (current, target) =>
      current.grinder === "pro" && target.grinder === "entry",
    effect: {
      grind: 0.9,
      ratioMultiplier: 0.96,
      timeDelta: -2,
      sources: ["rao", "research"],
      note:
        "Rao advierte que al pasar a molinos con más finos conviene abrir la molienda; estudios de extracción sugieren reducir el rendimiento para esquivar amargor.",
    },
  },
  {
    id: "grinder_mid_to_entry",
    label: "Molino intermedio → básico",
    applies: (current, target) =>
      current.grinder === "mid" && target.grinder === "entry",
    effect: {
      grind: 0.5,
      ratioMultiplier: 0.97,
      sources: ["rao"],
      note:
        "Rao señala que los molinos de entrada generan más finos; abre un poco la molienda y recorta el rendimiento para mantener claridad.",
    },
  },
  {
    id: "preinfusion_none_to_short",
    label: "Sin preinfusión → preinfusión corta",
    applies: (current, target) =>
      current.preinfusion === "none" && target.preinfusion === "short",
    effect: {
      grind: -0.5,
      timeDelta: 2,
      sources: ["rao"],
      note:
        "Rao recomienda que una preinfusión corta hidrate la cama antes del flujo fuerte; cierra la molienda y permite dos segundos extra controlados.",
    },
  },
  {
    id: "preinfusion_none_to_long",
    label: "Sin preinfusión → preinfusión larga",
    applies: (current, target) =>
      current.preinfusion === "none" && target.preinfusion === "long",
    effect: {
      grind: -0.9,
      timeDelta: 4,
      sources: ["rao", "gagne"],
      note:
        "Rao y los experimentos de Gagné muestran que preinfusiones largas homogenizan la cama; cierra más la molienda y extiende el tiempo unos segundos sin sobreextraer.",
    },
  },
  {
    id: "preinfusion_short_to_none",
    label: "Preinfusión corta → sin preinfusión",
    applies: (current, target) =>
      current.preinfusion === "short" && target.preinfusion === "none",
    effect: {
      grind: 0.5,
      timeDelta: -2,
      sources: ["rao"],
      note:
        "Rao advierte que al eliminar una preinfusión corta conviene abrir la molienda y reducir el tiempo para evitar channeling.",
    },
  },
  {
    id: "preinfusion_long_to_none",
    label: "Preinfusión larga → sin preinfusión",
    applies: (current, target) =>
      current.preinfusion === "long" && target.preinfusion === "none",
    effect: {
      grind: 0.9,
      timeDelta: -4,
      sources: ["rao"],
      note:
        "Según Rao, al quitar una preinfusión larga hay que abrir más la molienda y volver a tiempos breves para mantener el balance.",
    },
  },
  {
    id: "preinfusion_short_to_long",
    label: "Preinfusión corta → larga",
    applies: (current, target) =>
      current.preinfusion === "short" && target.preinfusion === "long",
    effect: {
      grind: -0.4,
      timeDelta: 2,
      sources: ["rao", "gagne"],
      note:
        "Rao y Gagné muestran que extender la preinfusión mejora la uniformidad; cierra un poco más la molienda y deja correr un par de segundos adicionales.",
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
  const sourceSet = new Set();

  const normalizeSources = (sources) => {
    if (!sources) return [];
    if (Array.isArray(sources)) return sources;
    return [sources];
  };

  const applyEffect = (effect, context) => {
    if (!effect) return;
    if (typeof effect.grind === "number") total.grindSteps += effect.grind;
    if (typeof effect.doseDelta === "number") total.doseDelta += effect.doseDelta;
    if (typeof effect.yieldDelta === "number") total.yieldDelta += effect.yieldDelta;
    if (typeof effect.timeDelta === "number") total.timeDelta += effect.timeDelta;
    if (typeof effect.ratioMultiplier === "number")
      total.ratioMultiplier *= effect.ratioMultiplier;

    const rationale = effect.rationale || effect.note;
    const noteSources = normalizeSources(effect.sources);

    if (rationale) {
      total.notes.push({ text: rationale, context, sources: noteSources });
    }

    noteSources.forEach((src) => {
      if (src) sourceSet.add(src);
    });
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
          sources: targetProfile.sources,
        },
        `Canasta ${targetProfile.label}`
      );
    }
  }

  transitionRules.forEach((rule) => {
    if (rule.applies(state.current, state.target)) {
      applyEffect(rule.effect, rule.label);
    }
  });

  const currentAccessories = new Set(state.current.accessories);
  const targetAccessories = new Set(state.target.accessories);

  targetAccessories.forEach((item) => {
    if (!currentAccessories.has(item)) {
      const effect = accessoryEffects[item];
      const context = `Añadir ${accessoryLabels[item] || item}`;
      applyEffect(effect, context);
    }
  });

  currentAccessories.forEach((item) => {
    if (!targetAccessories.has(item)) {
      const effect = accessoryEffects[item];
      if (effect) {
        const inverse = invertEffect(effect);
        const context = `Retirar ${accessoryLabels[item] || item}`;
        applyEffect(inverse, context);
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

  const aggregatedTotal = {
    ...total,
    sources: Array.from(sourceSet),
  };

  return {
    total: aggregatedTotal,
    base: state.base,
    recommended: {
      dose: recommendedDose,
      yield: recommendedYield,
      time: recommendedTime,
      ratio: newRatio,
    },
    baseRatio,
    changes: describeChanges(state),
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
  if (effect.sources) inverse.sources = effect.sources;
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

function describeChanges(state) {
  const changes = [];
  const { current, target } = state;

  const pushChange = (type, icon, text) => {
    changes.push({ type, icon, text });
  };

  if (current.machine !== target.machine) {
    pushChange(
      "machine",
      "🤖",
      `Máquina: ${machineLabels[current.machine]} → ${
        machineLabels[target.machine]
      }`
    );
  }

  if (current.basket !== target.basket) {
    pushChange(
      "basket",
      "🧺",
      `Canasta: ${basketCapacityLabels[current.basket]} → ${
        basketCapacityLabels[target.basket]
      }`
    );
  }

  if (current.basketType !== target.basketType) {
    pushChange(
      "basket-type",
      "🎯",
      `Tipo de canasta: ${basketTypeLabels[current.basketType]} → ${
        basketTypeLabels[target.basketType]
      }`
    );
  }

  if (current.grinder !== target.grinder) {
    pushChange(
      "grinder",
      "⚙️",
      `Molino: ${grinderLabels[current.grinder]} → ${
        grinderLabels[target.grinder]
      }`
    );
  }

  if (current.preinfusion !== target.preinfusion) {
    pushChange(
      "preinfusion",
      "💧",
      `Preinfusión: ${preinfusionLabels[current.preinfusion]} → ${
        preinfusionLabels[target.preinfusion]
      }`
    );
  }

  const currentAccessories = new Set(current.accessories);
  const targetAccessories = new Set(target.accessories);

  Array.from(targetAccessories).forEach((item) => {
    if (!currentAccessories.has(item)) {
      pushChange(
        "accessory-add",
        "➕",
        `Añades ${accessoryLabels[item] || item}`
      );
    }
  });

  Array.from(currentAccessories).forEach((item) => {
    if (!targetAccessories.has(item)) {
      pushChange(
        "accessory-remove",
        "➖",
        `Retiras ${accessoryLabels[item] || item}`
      );
    }
  });

  return changes;
}

function formatList(items) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return "";
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} y ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(", ")} y ${filtered[filtered.length - 1]}`;
}

function getSourceNames(sourceIds = []) {
  return sourceIds
    .map((id) => knowledgeSources[id]?.name || null)
    .filter(Boolean);
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
      plan: "Mantén la molienda actual y concentra los ajustes en dosis y tiempo.",
      direction: "neutral",
    };
  }
  if (steps <= -1.5) {
    return {
      label: "Mucho más fino",
      detail: "Cierra notablemente la molienda; en un molino escalonado equivale a 2-3 clics",
      plan: "Cierra la molienda de forma notable (2-3 clics) para aprovechar la estabilidad del nuevo set up.",
      direction: "finer",
    };
  }
  if (steps < -0.8) {
    return {
      label: "Más fino",
      detail: "Cierra la molienda alrededor de 1 clic o un ajuste pequeño en molino continuo",
      plan: "Cierra la molienda alrededor de 1 clic para sostener la resistencia del tiro.",
      direction: "finer",
    };
  }
  if (steps < -0.35) {
    return {
      label: "Ligeramente más fino",
      detail: "Haz un micro ajuste hacia lo fino",
      plan: "Haz un micro ajuste hacia lo fino para equilibrar el cambio.",
      direction: "finer",
    };
  }
  if (steps >= 1.5) {
    return {
      label: "Mucho más grueso",
      detail: "Abre la molienda 2-3 clics para compensar la resistencia extra",
      plan: "Abre la molienda 2-3 clics para aliviar la resistencia adicional que introduce el nuevo montaje.",
      direction: "coarser",
    };
  }
  if (steps > 0.8) {
    return {
      label: "Más grueso",
      detail: "Abre aproximadamente 1 clic en un molino escalonado",
      plan: "Abre la molienda alrededor de 1 clic para evitar que el flujo se frene.",
      direction: "coarser",
    };
  }
  return {
    label: "Ligeramente más grueso",
    detail: "Haz un micro ajuste hacia lo grueso",
    plan: "Abre apenas la molienda para compensar la resistencia adicional.",
    direction: "coarser",
  };
}

function buildPlanSummary(result, grindInfo) {
  const { base, recommended, baseRatio } = result;
  const sentences = [];

  if (grindInfo?.plan) {
    sentences.push(grindInfo.plan);
  }

  const doseDiff = recommended.dose - base.dose;
  if (Math.abs(doseDiff) >= 0.1) {
    const verb = doseDiff > 0 ? "Sube" : "Baja";
    sentences.push(
      `${verb} la dosis a ${recommended.dose.toFixed(1)} g (antes ${base.dose.toFixed(
        1
      )} g).`
    );
  } else if (base.dose) {
    sentences.push(`Mantén la dosis en ${base.dose.toFixed(1)} g.`);
  }

  const timeDiff = recommended.time - base.time;
  if (Math.abs(timeDiff) >= 0.2) {
    const verb = timeDiff > 0 ? "Extiende" : "Recorta";
    sentences.push(
      `${verb} el tiempo total hacia ${recommended.time.toFixed(1)} s (antes ${base.time.toFixed(
        1
      )} s).`
    );
  } else if (base.time) {
    sentences.push(`Mantén el tiempo cerca de ${base.time.toFixed(1)} s.`);
  }

  const ratioValid =
    Number.isFinite(baseRatio) &&
    Number.isFinite(result.recommended.ratio) &&
    baseRatio > 0 &&
    result.recommended.ratio > 0;

  if (ratioValid) {
    const ratioDiff = result.recommended.ratio - baseRatio;
    if (Math.abs(ratioDiff) >= 0.02) {
      const trend = ratioDiff > 0 ? "abrir" : "cerrar";
      sentences.push(
        `Esto implica ${trend} la relación a ${result.recommended.ratio.toFixed(2)} : 1 (antes ${baseRatio.toFixed(
          2
        )} : 1).`
      );
    }
  }

  return sentences.join(" ").trim();
}

function renderRecommendations(result) {
  const { base, baseRatio, recommended, total, changes } = result;

  const hasChangeList = Array.isArray(changes) && changes.length > 0;

  if (
    !hasChangeList &&
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

  const planSummary = buildPlanSummary(result, grindInfo) ||
    "Ajusta gradualmente los parámetros y valida en taza para confirmar la extracción.";
  const sourceNames = getSourceNames(total.sources || []);
  const planSupport = sourceNames.length
    ? `<p class="plan-support">Sustentado en ${formatList(sourceNames)}.</p>`
    : "";

  const changeHtml = hasChangeList
    ? `
      <section class="change-summary">
        <h4>Cambios detectados</h4>
        <div class="change-chip-group">
          ${changes
            .map(
              (change) => `
                <span class="change-chip">
                  ${
                    change.icon
                      ? `<span class="change-chip-icon" aria-hidden="true">${change.icon}</span>`
                      : ""
                  }
                  <span>${change.text}</span>
                </span>
              `
            )
            .join("")}
        </div>
      </section>
    `
    : "";

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
    <article class="plan-card">
      <div class="plan-icon" aria-hidden="true">🧭</div>
      <div>
        <h3>Plan de ajuste</h3>
        <p>${planSummary}</p>
        ${planSupport}
      </div>
    </article>
    ${changeHtml}
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
    const sourceDetails = (total.sources || [])
      .map((id) => {
        const source = knowledgeSources[id];
        if (!source) return null;
        return `${source.name} (${source.focus})`;
      })
      .filter(Boolean);

    const notesHtml = `
      <h3>¿Por qué sugerimos esto?</h3>
      <ul>
        ${total.notes
          .map((note) => {
            const context = note.context
              ? `<span class="note-context">${note.context}</span>`
              : "";
            return `
              <li>
                <span class="note-icon" aria-hidden="true">💡</span>
                <div class="note-body">
                  ${context}
                  <p>${note.text}</p>
                </div>
              </li>
            `;
          })
          .join("")}
      </ul>
      ${
        sourceDetails.length
          ? `<p class="note-footnote">Referencias consultadas: ${formatList(sourceDetails)}.</p>`
          : ""
      }
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
