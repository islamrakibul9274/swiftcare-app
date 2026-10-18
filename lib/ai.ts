export function deidentifiedObservation(
  durationMinutes: number,
  behaviors: {
    frequency?: number;
    durationSeconds?: number;
    intervals?: number;
    opportunities?: number;
  }[],
) {
  return {
    durationMinutes,
    observations: behaviors.map((b, i) => ({
      target: `Target ${i + 1}`,
      frequency: b.frequency || 0,
      durationSeconds: b.durationSeconds || 0,
      positiveIntervals: b.intervals || 0,
      totalIntervals: b.opportunities || 0,
    })),
  };
}
