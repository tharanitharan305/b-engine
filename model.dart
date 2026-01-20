// page_model.dart

// =======================
// ROOT PAGE MODEL
// =======================

class PageModel {
  final String version;
  final PageData page;

  PageModel({
    required this.version,
    required this.page,
  });

  factory PageModel.fromJson(Map<String, dynamic> json) {
    return PageModel(
      version: json['version'],
      page: PageData.fromJson(json['page']),
    );
  }
}

// =======================
// PAGE DATA (CANVAS)
// =======================

class PageData {
  final String id;
  final PageSize size;
  final String background;
  final List<PageElement> elements;

  PageData({
    required this.id,
    required this.size,
    required this.background,
    required this.elements,
  });

  factory PageData.fromJson(Map<String, dynamic> json) {
    return PageData(
      id: json['id'] ?? '',
      size: PageSize.fromJson(json['size']),
      background: json['background'] ?? '#FFFFFF',
      elements: (json['elements'] as List)
          .map((e) => PageElement.fromJson(e))
          .toList(),
    );
  }
}

// =======================
// PAGE SIZE
// =======================

class PageSize {
  final double width;
  final double height;

  PageSize({
    required this.width,
    required this.height,
  });

  factory PageSize.fromJson(Map<String, dynamic> json) {
    return PageSize(
      width: (json['width'] as num).toDouble(),
      height: (json['height'] as num).toDouble(),
    );
  }
}

// =======================
// PAGE ELEMENT (CORE)
// =======================

class PageElement {
  final String id;
  final ElementType type;
  final Frame frame;
  final ElementStyle style;
  final ElementData data;
  final ElementBehavior behavior;

  PageElement({
    required this.id,
    required this.type,
    required this.frame,
    required this.style,
    required this.data,
    required this.behavior,
  });

  factory PageElement.fromJson(Map<String, dynamic> json) {
    return PageElement(
      id: json['id'],
      type: ElementTypeX.fromString(json['type']),
      frame: Frame.fromJson(json['frame']),
      style: ElementStyle.fromJson(json['style'] ?? {}),
      data: ElementData.fromJson(json['data'] ?? {}),
      behavior: ElementBehavior.fromJson(json['behavior'] ?? {}),
    );
  }
}

// =======================
// ELEMENT TYPE ENUM
// =======================

enum ElementType {
  text,
  image,
  video,
  audio,
  math,
  model3d,
  live,
}

extension ElementTypeX on ElementType {
  static ElementType fromString(String value) {
    return ElementType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ElementType.text,
    );
  }
}

// =======================
// FRAME (POSITION + SIZE)
// =======================

class Frame {
  final double x;
  final double y;
  final double? width;
  final double? height;

  Frame({
    required this.x,
    required this.y,
    this.width,
    this.height,
  });

  factory Frame.fromJson(Map<String, dynamic> json) {
    return Frame(
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
      width: json['width'] != null
          ? (json['width'] as num).toDouble()
          : null,
      height: json['height'] != null
          ? (json['height'] as num).toDouble()
          : null,
    );
  }
}

// =======================
// STYLE (VISUAL)
// =======================

class ElementStyle {
  final double? fontSize;
  final String? color;
  final String? align;

  ElementStyle({
    this.fontSize,
    this.color,
    this.align,
  });

  factory ElementStyle.fromJson(Map<String, dynamic> json) {
    return ElementStyle(
      fontSize: json['fontSize'] != null
          ? (json['fontSize'] as num).toDouble()
          : null,
      color: json['color'],
      align: json['align'],
    );
  }
}

// =======================
// DATA (CONTENT)
// =======================

class ElementData {
  final String? value;    // text / math
  final String? src;      // image / video / audio / 3d
  final bool? controls;   // media
  final String? endpoint; // live data
  final int? refresh;     // seconds

  ElementData({
    this.value,
    this.src,
    this.controls,
    this.endpoint,
    this.refresh,
  });

  factory ElementData.fromJson(Map<String, dynamic> json) {
    return ElementData(
      value: json['value'],
      src: json['src'],
      controls: json['controls'],
      endpoint: json['endpoint'],
      refresh: json['refresh'],
    );
  }
}

// =======================
// BEHAVIOR (INTERACTION)
// =======================

class ElementBehavior {
  final String? onTap;
  final String? onLoad;

  ElementBehavior({
    this.onTap,
    this.onLoad,
  });

  factory ElementBehavior.fromJson(Map<String, dynamic> json) {
    return ElementBehavior(
      onTap: json['onTap'],
      onLoad: json['onLoad'],
    );
  }
}
