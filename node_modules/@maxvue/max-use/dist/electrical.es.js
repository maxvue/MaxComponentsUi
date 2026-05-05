import { t as __exportAll } from "./chunk-pbuEa-1d.js";
import { t as isBlank } from "./isBlank-CcaeMWGO.js";
import { toValue } from "vue";
//#region src/Helpers/Electrical/wireSize.ts
function toPhasePhase(phaseNeutralVoltage) {
	const array = [
		110,
		120,
		127,
		210,
		220,
		240,
		380,
		440,
		480
	];
	const valor = phaseNeutralVoltage * Math.sqrt(3);
	return array.reduce((anterior, atual) => Math.abs(atual - valor) < Math.abs(anterior - valor) ? atual : anterior);
}
/**
* Calcula a seção nominal de um cabo elétrico com base na corrente, opções de material, isolação, entre outros.
*
* @param current A corrente elétrica do circuito.
* @param options Opções do cálculo, como material, tensão, método de instalação e distância.
* @returns Um objeto com a bitola do cabo, a corrente máxima, a queda de tensão e a porcentagem de perda.
*/
async function wireSize(current, options) {
	const data = toValue(current);
	if (isBlank(data)) return null;
	const currentVal = parseFloat(String(data));
	if (currentVal === 0) return {
		wire: 0,
		max_current: 0,
		voltage_drop: 0,
		loss_percent: 0
	};
	const material = String(options.material ?? "").includes("al") ? "al" : "cu";
	const isolation = String(options.isolation ?? "").includes("xlpe") || String(options.isolation ?? "").includes("epr") || String(options.isolation ?? "").includes("90") ? "90" : "70";
	const method = options.method ?? null;
	const phase_name = Number(options?.phases) > 2 ? "tri" : "bi";
	const phases = Number(options?.phases) > 2 ? 3 : 2;
	const voltage = options?.voltage ?? 220;
	const length = Number(options?.length ?? 10);
	const max_percent = Number(options?.max_loss ?? 5);
	const resistivity = {
		"cu": {
			"70": .0225,
			"90": .024
		},
		"al": {
			"70": .036,
			"90": .036
		}
	};
	const safeMaterial = material;
	const safeIsolation = isolation;
	const rho = resistivity[safeMaterial][safeIsolation];
	const voltage_base = phases === 3 ? toPhasePhase(Number(voltage)) : voltage;
	const voltage_drop_allowed = (phases === 3 ? voltage_base : voltage) * (max_percent / 100);
	const section = phases === 3 ? Math.sqrt(3) * currentVal * length * rho / voltage_drop_allowed : 2 * currentVal * length * rho / voltage_drop_allowed;
	const data_return = {
		wire: Number([
			.5,
			.75,
			1,
			1.5,
			2.5,
			4,
			6,
			10,
			16,
			25,
			35,
			50,
			70,
			95,
			120,
			150,
			185,
			240,
			300,
			400,
			500,
			630,
			800,
			1e3
		].find((w) => w >= section) || 1e3),
		max_current: currentVal,
		voltage_drop: Number(voltage_drop_allowed.toFixed(2)),
		loss_percent: Number(max_percent.toFixed(2))
	};
	try {
		const dados = await (await fetch(`../json/${material}-${isolation}-${phase_name}-${method}.json`)).json();
		const item = dados.find((c) => c.max_current >= currentVal);
		if (item && item.wire >= data_return.wire) {
			data_return.wire = item.wire;
			data_return.max_current = item.max_current;
		} else if (item) {
			const wire_table = dados.find((c) => c.wire === data_return.wire);
			if (wire_table) data_return.max_current = wire_table.max_current;
		}
	} catch {}
	const cosPhi = .95;
	const R_por_metro = rho / data_return.wire;
	const X_por_metro = 1e-4;
	const sinPhi = Math.sqrt(1 - Math.pow(cosPhi, 2));
	const Z_efetiva = R_por_metro * cosPhi + X_por_metro * sinPhi;
	const voltage_drop = Number((phases === 3 ? Math.sqrt(3) : 2) * currentVal * length * Z_efetiva);
	const percent_drop = Number(voltage_drop / voltage_base * 100);
	data_return.voltage_drop = Number(voltage_drop.toFixed(2));
	data_return.loss_percent = Number(percent_drop.toFixed(2));
	return data_return;
}
//#endregion
//#region src/Helpers/Electrical/index.ts
var Electrical_exports = /* @__PURE__ */ __exportAll({
	electric: () => electric,
	electrical: () => electrical,
	wireSize: () => wireSize
});
var electrical = { wireSize };
var electric = electrical;
//#endregion
export { electric, electrical, Electrical_exports as t, wireSize };

//# sourceMappingURL=electrical.es.js.map