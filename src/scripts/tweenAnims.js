const tweens = {
  driveIn: [
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
  riseUp: [
    {
      object: "camera",
      move: "position",
      axis: "y",
      duration: 1500,
      easing: "easeOutQuad",
      from: 2,
    },
  ],
  dropDown: [
    {
      object: "camera",
      move: "position",
      axis: "y",
      duration: 1500,
      easing: "easeOutQuad",
      from: -1,
    },
  ],
  zoomIn: [
    {
      object: "camera",
      move: "position",
      axis: "z",
      duration: 2000,
      easing: "easeOutQuad",
      from: 6,
    },
  ],
  zoomOut: [
    {
      object: "camera",
      move: "position",
      axis: "z",
      duration: 2000,
      easing: "easeOutQuad",
      from: -6,
    },
  ],
};

export default tweens;
