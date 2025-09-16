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
      "Barista Hustle recuerda que las cestas pequeñas requieren dejar más headspace para evitar sobrepresión.",
  },
  medium: {
    label: "Media (18 g)",
    ratio: 1,
    minDose: 17,
    maxDose: 19,
    note:
      "Barista Hustle sugiere que las canastas de 18 g rinden mejor cerca de su capacidad nominal.",
  },
  large: {
    label: "Grande (20-22 g)",
    ratio: 1.17,
    minDose: 20,
    maxDose: 22,
    note:
      "Según las guías de Barista Hustle, las canastas de mayor volumen aprovechan mejor dosis de 20-22 g para distribuir uniforme la cama.",
  },
};

const accessoryEffects = {
  "top-screen": {
    grind: 0.6,
    doseDelta: -0.4,
    timeDelta: 1,
    note:
      "Scott Rao documenta que un puck screen superior añade resistencia y reduce el headspace, por lo que conviene abrir un poco la molienda y recortar la dosis ~0.5 g.",
  },
  "bottom-screen": {
    grind: 0.7,
    timeDelta: 1.5,
    note:
      "Experimentos recopilados por Scott Rao muestran que un puck screen inferior actúa como filtro restrictivo, aumentando el tiempo de extracción y requiriendo molienda ligeramente más gruesa.",
  },
  "paper-top": {
    grind: 0.3,
    doseDelta: -0.3,
    note:
      "Jonathan Gagné explica que un filtro de papel superior absorbe parte del headspace y limita la turbulencia inicial, por lo que es útil reducir un poco la dosis y abrir marginalmente la molienda.",
  },
  "paper-bottom": {
    grind: 0.8,
    ratioMultiplier: 1.03,
    timeDelta: 2.5,
    note:
      "Jonathan Gagné y Barista Hustle han mostrado que un filtro de papel inferior aumenta la uniformidad pero también la resistencia; se recomienda moler más grueso y aceptar tiempos ligeramente más largos.",
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
        "Scott Rao señala que las máquinas prosumer mantienen caudal y temperatura más estables, por lo que suele ser necesario cerrar la molienda para sostener el tiempo objetivo.",
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
        "Al pasar a una máquina casera se pierde presión consistente; Rao sugiere abrir un poco la molienda y aceptar tiros algo más cortos para evitar channelling.",
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
        "Los grupos de palanca facilitan preinfusión natural (Gagné), así que se puede cerrar ligeramente la molienda y permitir un poco más de tiempo.",
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
        "Al volver de una máquina de palanca a una casera sin preinfusión, Scott Rao recomienda abrir un poco la molienda y recortar tiempos para mantener balance.",
    },
  },
  {
    id: "basket_standard_to_precision",
    applies: (current, target) =>
      current.basketType === "standard" && target.basketType === "precision",
    effect: {
      grind: -0.8,
      note:
        "Las canastas de precisión tienen agujeros uniformes que aceleran el flujo (Barista Hustle), por lo que conviene moler más fino para recuperar la resistencia.",
    },
  },
  {
    id: "basket_precision_to_standard",
    applies: (current, target) =>
      current.basketType === "precision" && target.basketType === "standard",
    effect: {
      grind: 0.8,
      note:
        "Al pasar de una canasta de precisión a una estándar el flujo se frena; Barista Hustle sugiere abrir la molienda para evitar sobreextracción desigual.",
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
        "Estudios de Socratic Coffee y análisis de Jonathan Gagné muestran que molinos de alta precisión permiten extraer más, por lo que se puede cerrar la molienda y aumentar el rendimiento ligeramente.",
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
        "Con un molino intermedio hay menos finos, así que puedes moler algo más fino y apuntar a un 2-3 % más de rendimiento, como sugiere Gagné en sus comparativas de distribución de partículas.",
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
        "Al pasar a muelas de alta precisión (Scott Rao), se gana uniformidad; cierra un poco la molienda y permite un ligero aumento del rendimiento.",
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
        "Si bajas a un molino con más variación, conviene abrir la molienda y reducir el rendimiento para evitar sabores amargos, como recomienda Scott Rao y respalda la literatura de extracción.",
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
        "Molinos de entrada generan más finos; Barista Hustle propone abrir un poco la molienda y recortar el rendimiento para mantener claridad.",
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
        "Barista Hustle y Scott Rao recomiendan aprovechar una preinfusión corta para cerrar ligeramente la molienda y permitir 2 s más de extracción controlada.",
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
        "Jonathan Gagné muestra que preinfusiones largas homogenizan la cama, permitiendo moler bastante más fino y extender el tiempo total unos segundos sin sobreextraer.",
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
        "Si eliminas la preinfusión corta, abre la molienda y reduce el tiempo para evitar channeling (recomendación de Barista Hustle).",
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
        "Al quitar una preinfusión larga, Rao propone abrir bastante la molienda y volver a tiempos más breves para mantener el balance.",
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
        "Extender la preinfusión favorece uniformidad (Gagné), así que puedes cerrar un poco más la molienda y dejar correr 2 s adicionales.",
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

function formatDelta(delta, unit) {
  if (Math.abs(delta) < 0.05) return "";
  const symbol = delta > 0 ? "+" : "";
  return ` (${symbol}${delta.toFixed(1)} ${unit})`;
}

function describeGrind(steps) {
  if (Math.abs(steps) < 0.35) {
    return { label: "Sin cambios grandes", detail: "Mantén el punto de molienda" };
  }
  if (steps <= -1.5) {
    return {
      label: "Mucho más fino",
      detail: "Cierra notablemente la molienda; en un molino escalonado equivale a 2-3 clics",
    };
  }
  if (steps < -0.8) {
    return {
      label: "Más fino",
      detail: "Cierra la molienda alrededor de 1 clic o un ajuste pequeño en molino continuo",
    };
  }
  if (steps < -0.35) {
    return {
      label: "Ligeramente más fino",
      detail: "Haz un micro ajuste hacia lo fino",
    };
  }
  if (steps >= 1.5) {
    return {
      label: "Mucho más grueso",
      detail: "Abre la molienda 2-3 clics para compensar la resistencia extra",
    };
  }
  if (steps > 0.8) {
    return {
      label: "Más grueso",
      detail: "Abre aproximadamente 1 clic en un molino escalonado",
    };
  }
  return {
    label: "Ligeramente más grueso",
    detail: "Haz un micro ajuste hacia lo grueso",
  };
}

function renderRecommendations(result) {
  const { base, baseRatio, recommended, total } = result;

  if (
    Math.abs(total.doseDelta) < 0.05 &&
    Math.abs(total.timeDelta) < 0.1 &&
    Math.abs(total.yieldDelta) < 0.1 &&
    Math.abs(total.grindSteps) < 0.2 &&
    total.ratioMultiplier === 1
  ) {
    summaryEl.innerHTML =
      "<p>No detectamos cambios en la configuración. Mantén tu receta tal cual y ajusta solo con la cata.</p>";
    detailsEl.innerHTML = "";
    return;
  }

  const grindInfo = describeGrind(total.grindSteps);

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
      base: `${baseRatio.toFixed(2)} : 1`,
      recommended: `${recommended.ratio.toFixed(2)} : 1`,
      delta: formatDelta(recommended.ratio - baseRatio, "ratio"),
    },
  ];

  const tableHtml = `
    <div class="grind-chip">⚙️ ${grindInfo.label}</div>
    <p class="grind-detail">${grindInfo.detail}</p>
    <table class="recommendation-table">
      <thead>
        <tr>
          <th>Variable</th>
          <th>Receta base</th>
          <th>Propuesta</th>
          <th>Diferencia</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${row.label}</td>
                <td>${row.base}</td>
                <td>${row.recommended}</td>
                <td>${row.delta || ""}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;

  summaryEl.innerHTML = tableHtml;

  if (total.notes.length) {
    const notesHtml = `
      <h3>Argumentos de los ajustes</h3>
      <ul>
        ${total.notes
          .map((note) => `<li>${note.text}</li>`)
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
