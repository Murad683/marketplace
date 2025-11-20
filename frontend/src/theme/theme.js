export const lightTheme = {
  mode: "light",
  text: {
    primary: "#37474F",
    secondary: "#546E7A",
    disabled: "rgba(55, 71, 79, 0.45)",
  },
  background: {
    primary: "#CFD8DC",
    secondary: "#B0BEC5",
    tertiary: "#90A4AE0F",
    card: "#FFFFFF",
    navbar: "#37474F",
  },
  border: {
    strong: "#546E7A",
    soft: "rgba(84, 110, 122, 0.25)",
    divider: "rgba(84, 110, 122, 0.25)",
  },
  button: {
    primary: {
      bg: "#546E7A",
      text: "#FFFFFF",
      hover: "#37474F",
      border: "transparent",
    },
    secondary: {
      bg: "transparent",
      text: "#546E7A",
      hover: "rgba(84, 110, 122, 0.15)",
      border: "#546E7A",
    },
  },
  input: {
    bg: "#FFFFFF",
    border: "rgba(144, 164, 174, 0.5)",
    text: "#37474F",
    placeholder: "rgba(55, 71, 79, 0.5)",
  },
  accent: "#C5A572",
  shadow: {
    card: "0 22px 60px -30px rgba(55, 71, 79, 0.25)",
    soft: "0 10px 30px -20px rgba(55, 71, 79, 0.25)",
  },
};

export const darkTheme = {
  mode: "dark",
  text: {
    primary: "#CFD8DC",
    secondary: "#90A4AE",
    disabled: "rgba(207, 216, 220, 0.45)",
  },
  background: {
    primary: "#11171A",
    secondary: "#1E272C",
    tertiary: "rgba(144, 164, 174, 0.07)",
    card: "#1F2A30",
    navbar: "#11171A",
  },
  border: {
    strong: "#90A4AE",
    soft: "rgba(207, 216, 220, 0.12)",
    divider: "rgba(207, 216, 220, 0.12)",
  },
  button: {
    primary: {
      bg: "#546E7A",
      text: "#FFFFFF",
      hover: "#37474F",
      border: "transparent",
    },
    secondary: {
      bg: "transparent",
      text: "#CFD8DC",
      hover: "rgba(144, 164, 174, 0.15)",
      border: "rgba(207, 216, 220, 0.35)",
    },
  },
  input: {
    bg: "#1E272C",
    border: "rgba(144, 164, 174, 0.35)",
    text: "#CFD8DC",
    placeholder: "rgba(144, 164, 174, 0.65)",
  },
  accent: "#D8BC78",
  shadow: {
    card: "0 22px 60px -32px rgba(0, 0, 0, 0.55)",
    soft: "0 12px 40px -28px rgba(0, 0, 0, 0.5)",
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
