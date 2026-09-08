const DEFAULT_API_URL = 'http://localhost:8081';

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL
).replace(/\/+$/, '');

export type AuthUser = {
  id?: string;
  _id?: string;
  name?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
};

export type LoginResponse = {
  user: AuthUser;
  token: string;
  message?: string;
};

type LoginCredentials = {
  phone: string;
  password: string;
};

type ErrorResponse = {
  message?: string;
};

export class AuthServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
  }
}

function normalizePhone(phone: string) {
  let digits = phone.replace(/\D/g, '');

  // Si recibe +1 8091234567, elimina el código internacional.
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    throw new AuthServiceError(
      'El número de teléfono debe tener 10 dígitos.',
      400,
    );
  }

  return digits;
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: normalizePhone(credentials.phone),
      password: credentials.password,
    }),
  });

  const data = (await response
    .json()
    .catch(() => null)) as LoginResponse | ErrorResponse | null;

  if (!response.ok) {
    const message =
      data && 'message' in data && data.message
        ? data.message
        : 'No se pudo iniciar sesión.';

    throw new AuthServiceError(message, response.status);
  }

  if (
    !data ||
    !('token' in data) ||
    !('user' in data) ||
    typeof data.token !== 'string'
  ) {
    throw new AuthServiceError(
      'La respuesta del servidor no tiene el formato esperado.',
      response.status,
    );
  }

  return data;
}