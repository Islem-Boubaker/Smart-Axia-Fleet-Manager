type MaybeCoords = {
  latitude?: number | null;
  longitude?: number | null;
};

type MaybeStop = MaybeCoords & {
  id?: string | number | null;
  stopOrder?: number | null;
  locationName?: string | null;
};

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export function areCloseCoords(
  a: MaybeCoords | null | undefined,
  b: MaybeCoords | null | undefined,
  epsilon = 0.0002,
): boolean {
  if (
    a?.latitude == null ||
    a?.longitude == null ||
    b?.latitude == null ||
    b?.longitude == null
  ) {
    return false;
  }

  return (
    Math.abs(a.latitude - b.latitude) <= epsilon &&
    Math.abs(a.longitude - b.longitude) <= epsilon
  );
}

export function isSameStopAsDestination(
  stop: MaybeStop | null | undefined,
  destinationLabel: string | null | undefined,
  destinationCoords: MaybeCoords | null | undefined,
): boolean {
  if (!stop) return false;

  if (areCloseCoords(stop, destinationCoords)) {
    return true;
  }

  const stopLabel = normalizeText(stop.locationName);
  const endLabel = normalizeText(destinationLabel);
  return Boolean(stopLabel && endLabel && stopLabel === endLabel);
}

export function filterDestinationDuplicateStops<T extends MaybeStop>(
  stops: T[],
  destinationLabel: string | null | undefined,
  destinationCoords: MaybeCoords | null | undefined,
): T[] {
  if (stops.length === 0) return stops;

  let removedDuplicate = false;

  return stops.filter((stop, index) => {
    const isDuplicate = isSameStopAsDestination(stop, destinationLabel, destinationCoords);

    if (!isDuplicate || removedDuplicate) {
      return true;
    }

    const hasLaterNonDuplicateStop = stops
      .slice(index + 1)
      .some((nextStop) => !isSameStopAsDestination(nextStop, destinationLabel, destinationCoords));

    if (hasLaterNonDuplicateStop) {
      return true;
    }

    removedDuplicate = true;
    return false;
  });
}
