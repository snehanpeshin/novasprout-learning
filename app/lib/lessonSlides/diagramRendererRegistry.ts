export type DiagramRendererFamily =
  | "anatomy"
  | "electricity"
  | "geometry"
  | "general"
  | "statistics";

const rendererRegistry: Record<DiagramRendererFamily, Set<string>> = {
  anatomy: new Set(["labeled_system", "annotated_image", "structure_function"]),
  electricity: new Set([
    "battery_symbol",
    "circuit_diagram",
    "electric_power",
    "electric_relationships",
    "ohms_law",
    "parallel_circuit",
    "series_circuit",
    "series_parallel_comparison",
    "voltmeter_circuit"
  ]),
  general: new Set([
    "callout",
    "comparison_table",
    "concept_map",
    "cooling_sequence",
    "cover_illustration",
    "equation_steps",
    "flowchart",
    "icon_grid",
    "labeled_cards",
    "microstate_model",
    "process_sequence",
    "ratio_table",
    "vocabulary_grid",
    "worked_solution"
  ]),
  geometry: new Set([
    "coordinate_graph",
    "coordinate_space_3d",
    "double_number_line",
    "shape_classification",
    "solid_geometry",
    "solid_net",
    "tape_diagram"
  ]),
  statistics: new Set([
    "confidence_interval",
    "data_table",
    "normal_tail",
    "population_distribution",
    "repeated_samples",
    "sampling_distribution",
    "scientific_graph",
    "standard_error_comparison"
  ])
};

export function supportsDiagramType(type?: string) {
  return Boolean(type && Object.values(rendererRegistry).some((types) => types.has(type)));
}

export function diagramRendererFamily(type?: string): DiagramRendererFamily | undefined {
  return (Object.entries(rendererRegistry) as Array<[DiagramRendererFamily, Set<string>]>)
    .find(([, types]) => Boolean(type && types.has(type)))?.[0];
}

export function registeredDiagramTypes() {
  return Object.fromEntries(
    (Object.entries(rendererRegistry) as Array<[DiagramRendererFamily, Set<string>]>)
      .map(([family, types]) => [family, [...types].sort()])
  ) as Record<DiagramRendererFamily, string[]>;
}
