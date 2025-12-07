class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  area(width, height) {
    return width * height;
  }

  parameter(width, height) {
    return 2 * (width + height);
  }
}

class Square extends Rectangle {
  isSquare(width, height) {
    return width === height;
  }
}
