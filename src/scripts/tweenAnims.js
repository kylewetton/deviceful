const tweens = {
  flyIn: [
    {
      object: "model",
      move: "rotation",
      axis: "y",
      duration: 1500,
      easing: "swingTo",
      from: -30,
    },
    {
      object: "camera",
      move: "position",
      axis: "y",
      duration: 2000,
      easing: "easeOutQuad",
      from: 3,
    },
    {
      object: "camera",
      move: "position",
      axis: "z",
      duration: 2000,
      easing: "easeOutQuad",
      from: 20,
    },
    {
      object: "camera",
      move: "rotation",
      axis: "x",
      duration: 2000,
      easing: "easeOutQuad",
      from: -5,
    },
  ],
};

export default tweens;
