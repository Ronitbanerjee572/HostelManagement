/** Resolve common Oracle APEX / ORDS field name variants */
export function field(record, ...keys) {
  if (!record) return undefined;
  for (const key of keys) {
    const val = record[key];
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return undefined;
}

export function recordId(record, ...candidates) {
  return field(record, ...candidates) ?? field(record, 'id');
}

export function matchesStudentId(record, studentId) {
  const rid = field(record, 'student_id', 'STUDENT_ID');
  if (rid == null || studentId == null) return false;
  return String(rid) === String(studentId);
}
