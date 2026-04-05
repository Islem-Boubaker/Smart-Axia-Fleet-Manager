let csrfToken: string | null = null;

export const setCsrfToken = (token: string | null): void => {
	csrfToken = token;
};

export const getCsrfToken = (): string | null => {
	return csrfToken;
};

export const clearCsrfToken = (): void => {
	csrfToken = null;
};
