using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: AssemblyTitle("绘梦工坊 AI 创作台")]
[assembly: AssemblyDescription("AI 图像与视频生成客户端")]
[assembly: AssemblyCompany("绘梦工坊")]
[assembly: AssemblyProduct("DreamVideo Studio")]
[assembly: AssemblyCopyright("Copyright 2026")]
[assembly: AssemblyVersion("1.2.0.0")]
[assembly: AssemblyFileVersion("1.2.0.0")]

static class Ui
{
    public static readonly Color Bg = Color.FromArgb(10, 14, 26);
    public static readonly Color Card = Color.FromArgb(20, 26, 44);
    public static readonly Color Line = Color.FromArgb(34, 42, 64);
    public static readonly Color Text1 = Color.FromArgb(236, 240, 253);
    public static readonly Color Text2 = Color.FromArgb(138, 148, 176);
    public static readonly Color Text3 = Color.FromArgb(92, 102, 130);
    public static readonly Color Accent = Color.FromArgb(124, 92, 255);
    public static readonly Color Accent2 = Color.FromArgb(56, 189, 248);
    public static readonly Color Field = Color.FromArgb(13, 19, 34);
    public static readonly Color FieldLine = Color.FromArgb(38, 48, 76);
    public static readonly Color Hover = Color.FromArgb(30, 39, 64);
    public static readonly Color Ok = Color.FromArgb(52, 211, 153);
    public static readonly Color Warn = Color.FromArgb(251, 191, 36);

    public static readonly Font F8 = new Font("微软雅黑", 8f);
    public static readonly Font F85 = new Font("微软雅黑", 8.5f);
    public static readonly Font F9 = new Font("微软雅黑", 9f);
    public static readonly Font F95 = new Font("微软雅黑", 9.5f);
    public static readonly Font F95B = new Font("微软雅黑", 9.5f, FontStyle.Bold);
    public static readonly Font F105B = new Font("微软雅黑", 10.5f, FontStyle.Bold);
    public static readonly Font F115B = new Font("微软雅黑", 11.5f, FontStyle.Bold);
    public static readonly Font F12B = new Font("微软雅黑", 12.5f, FontStyle.Bold);
    public static readonly Font F11B = new Font("微软雅黑", 11f, FontStyle.Bold);

    public static Color Mix(Color a, Color b, float t)
    {
        return Color.FromArgb(
            (int)(a.R + (b.R - a.R) * t),
            (int)(a.G + (b.G - a.G) * t),
            (int)(a.B + (b.B - a.B) * t));
    }

    public static GraphicsPath RoundPath(Rectangle r, int radius)
    {
        var p = new GraphicsPath();
        if (radius <= 1) { p.AddRectangle(r); return p; }
        int d = radius * 2;
        if (d > r.Width) d = r.Width;
        if (d > r.Height) d = r.Height;
        if (d <= 0) { p.AddRectangle(r); return p; }
        p.AddArc(r.X, r.Y, d, d, 180, 90);
        p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }

    public static Label Lbl(string text, int x, int y, int w, int h, float size, Color color, bool bold)
    {
        return new Label
        {
            Text = text, Left = x, Top = y, Width = w, Height = h,
            Font = new Font("微软雅黑", size, bold ? FontStyle.Bold : FontStyle.Regular),
            ForeColor = color, BackColor = Color.Transparent,
            TextAlign = ContentAlignment.MiddleLeft, AutoSize = false
        };
    }

    public static void Star(Graphics g, float cx, float cy, float r, Brush br)
    {
        float t = r * 0.2f;
        PointF[] v = new PointF[] {
            new PointF(cx, cy - r), new PointF(cx + t, cy), new PointF(cx, cy + r), new PointF(cx - t, cy)
        };
        PointF[] h = new PointF[] {
            new PointF(cx - r, cy), new PointF(cx, cy - t), new PointF(cx + r, cy), new PointF(cx, cy + t)
        };
        g.FillPolygon(br, v);
        g.FillPolygon(br, h);
    }
}

class Card : Panel
{
    public int Radius = 14;
    public Card()
    {
        BackColor = Ui.Card;
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
    }
    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        if (Width > 30 && Height > 30)
            Region = new Region(Ui.RoundPath(new Rectangle(0, 0, Width, Height), Radius));
    }
    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        var r = new Rectangle(0, 0, Width - 1, Height - 1);
        using (var p = new Pen(Color.FromArgb(44, 54, 84)))
        using (var path = Ui.RoundPath(r, Radius))
            g.DrawPath(p, path);
        if (Width > 40)
        {
            using (var lg = new LinearGradientBrush(new Rectangle(0, 0, Width, 2), Color.FromArgb(96, 124, 92, 255), Color.FromArgb(10, 56, 189, 248), 0f))
            using (var path2 = Ui.RoundPath(new Rectangle(0, 0, Width, 2), 1))
                g.FillPath(lg, path2);
        }
    }
}

class RoundButton : Button
{
    public Color Color1 = Ui.Accent;
    public Color Color2 = Ui.Accent2;
    int radius = 12;
    public int Radius
    {
        get { return radius; }
        set { radius = value; ApplyRegion(); }
    }
    void ApplyRegion()
    {
        if (Width > 6 && Height > 6)
            Region = new Region(Ui.RoundPath(new Rectangle(0, 0, Width, Height), radius));
    }
    protected override void OnResize(EventArgs e) { base.OnResize(e); ApplyRegion(); }
    bool hover, down;

    public RoundButton()
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        BackColor = Color.Transparent;
        Cursor = Cursors.Hand;
        Font = Ui.F95B;
        ForeColor = Color.White;
    }
    protected override void OnMouseEnter(EventArgs e) { hover = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { hover = false; down = false; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnMouseDown(MouseEventArgs e) { down = true; Invalidate(); base.OnMouseDown(e); }
    protected override void OnMouseUp(MouseEventArgs e) { down = false; Invalidate(); base.OnMouseUp(e); }
    protected override void OnEnabledChanged(EventArgs e) { Invalidate(); base.OnEnabledChanged(e); }
    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        if (Width < 4 || Height < 4) return;
        var r = new Rectangle(0, 0, Width - 1, Height - 1);
        Color c1 = Color1, c2 = Color2;
        if (!Enabled) { c1 = Color.FromArgb(36, 44, 66); c2 = Color.FromArgb(46, 56, 82); }
        else if (down) { c1 = Ui.Mix(Color1, Color.Black, 0.18f); c2 = Ui.Mix(Color2, Color.Black, 0.18f); }
        else if (hover) { c1 = Ui.Mix(Color1, Color.White, 0.14f); c2 = Ui.Mix(Color2, Color.White, 0.14f); }
        using (var br = new LinearGradientBrush(new Rectangle(0, 0, Width, Height), c1, c2, 0f))
        using (var path = Ui.RoundPath(r, Radius))
            g.FillPath(br, path);
        if (Enabled && Height > 16)
        {
            using (var br2 = new LinearGradientBrush(new Rectangle(0, 0, Width, Math.Max(2, Height / 2)), Color.FromArgb(34, 255, 255, 255), Color.FromArgb(0, 255, 255, 255), 90f))
            using (var p2 = Ui.RoundPath(new Rectangle(0, 0, Width - 1, Math.Max(2, Height / 2)), Radius))
                g.FillPath(br2, p2);
        }
        TextRenderer.DrawText(g, Text, Font, new Rectangle(0, 0, Width, Height - 1),
            Enabled ? Color.White : Ui.Text3, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
    }
}

class GhostButton : Button
{
    int radius = 10;
    public int Radius
    {
        get { return radius; }
        set { radius = value; ApplyRegion(); }
    }
    void ApplyRegion()
    {
        if (Width > 6 && Height > 6)
            Region = new Region(Ui.RoundPath(new Rectangle(0, 0, Width, Height), radius));
    }
    protected override void OnResize(EventArgs e) { base.OnResize(e); ApplyRegion(); }
    bool hover, down;

    public GhostButton()
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        BackColor = Color.Transparent;
        Cursor = Cursors.Hand;
        Font = Ui.F85;
        ForeColor = Ui.Text2;
    }
    protected override void OnMouseEnter(EventArgs e) { hover = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { hover = false; down = false; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnMouseDown(MouseEventArgs e) { down = true; Invalidate(); base.OnMouseDown(e); }
    protected override void OnMouseUp(MouseEventArgs e) { down = false; Invalidate(); base.OnMouseUp(e); }
    protected override void OnEnabledChanged(EventArgs e) { Invalidate(); base.OnEnabledChanged(e); }
    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        if (Width < 4 || Height < 4) return;
        var r = new Rectangle(0, 0, Width - 1, Height - 1);
        Color fill = down ? Color.FromArgb(38, 48, 74) : (hover ? Ui.Hover : Color.FromArgb(17, 23, 39));
        using (var br = new SolidBrush(fill))
        using (var path = Ui.RoundPath(r, Radius))
            g.FillPath(br, path);
        Color edge = hover ? Color.FromArgb(140, 124, 92, 255) : Ui.FieldLine;
        using (var p = new Pen(edge))
        using (var path2 = Ui.RoundPath(r, Radius))
            g.DrawPath(p, path2);
        TextRenderer.DrawText(g, Text, Font, new Rectangle(0, 0, Width, Height - 1),
            !Enabled ? Ui.Text3 : (hover ? Ui.Text1 : Ui.Text2),
            TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
    }
}

class Seg : Control
{
    public List<string> Items = new List<string>();
    int sel = 0;
    int hover = -1;
    public event EventHandler SelectedIndexChanged;

    public int SelectedIndex
    {
        get { return sel; }
        set
        {
            int v = value;
            if (v < 0) v = 0;
            if (Items.Count > 0 && v >= Items.Count) v = Items.Count - 1;
            if (v == sel) { Invalidate(); return; }
            sel = v;
            Invalidate();
            if (SelectedIndexChanged != null) SelectedIndexChanged(this, EventArgs.Empty);
        }
    }

    public Seg()
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        BackColor = Ui.Card;
        Font = Ui.F85;
        Cursor = Cursors.Hand;
    }

    int Count { get { return Items.Count == 0 ? 1 : Items.Count; } }
    int ItemW { get { int w = (Width - (Count - 1) * 6) / Count; return w < 8 ? 8 : w; } }
    int Hit(Point p)
    {
        int w = ItemW + 6;
        int i = p.X / (w <= 0 ? 1 : w);
        if (i < 0) i = 0;
        if (i >= Count) i = Count - 1;
        return i;
    }
    protected override void OnMouseMove(MouseEventArgs e)
    {
        int h = Hit(e.Location);
        if (h != hover) { hover = h; Invalidate(); }
        base.OnMouseMove(e);
    }
    protected override void OnMouseLeave(EventArgs e) { hover = -1; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnMouseDown(MouseEventArgs e) { SelectedIndex = Hit(e.Location); base.OnMouseDown(e); }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        if (Width < 8 || Height < 8) return;
        int w = ItemW;
        for (int i = 0; i < Count; i++)
        {
            var r = new Rectangle(i * (w + 6), 0, w, Height - 1);
            bool on = (i == sel);
            using (var path = Ui.RoundPath(r, 9))
            {
                if (on)
                {
                    using (var br = new LinearGradientBrush(new Rectangle(r.X, r.Y, Math.Max(2, r.Width), Math.Max(4, r.Height)), Color.FromArgb(64, 56, 120), Color.FromArgb(34, 60, 100), 0f))
                        g.FillPath(br, path);
                    using (var p = new Pen(Color.FromArgb(120, 124, 92, 255)))
                        g.DrawPath(p, path);
                }
                else
                {
                    if (i == hover)
                        using (var br = new SolidBrush(Ui.Hover)) g.FillPath(br, path);
                    using (var p = new Pen(Ui.FieldLine)) g.DrawPath(p, path);
                }
            }
            string t = i < Items.Count ? Items[i] : "";
            TextRenderer.DrawText(g, t, Font, r, on ? Ui.Text1 : Ui.Text2,
                TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
        }
    }
}

class ModelPicker : Control
{
    public List<object> Items = new List<object>();
    int sel = 0;
    bool hover;
    public event EventHandler SelectedIndexChanged;

    public int SelectedIndex
    {
        get { return sel; }
        set
        {
            int v = value;
            if (v < 0) v = 0;
            if (Items.Count > 0 && v >= Items.Count) v = Items.Count - 1;
            bool ch = v != sel;
            sel = v;
            Invalidate();
            if (ch && SelectedIndexChanged != null) SelectedIndexChanged(this, EventArgs.Empty);
        }
    }
    public object SelectedItem
    {
        get { return (sel >= 0 && sel < Items.Count) ? Items[sel] : null; }
    }

    public ModelPicker()
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        BackColor = Ui.Card;
        Cursor = Cursors.Hand;
    }

    protected override void OnMouseEnter(EventArgs e) { hover = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { hover = false; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnMouseDown(MouseEventArgs e) { OpenDrop(); base.OnMouseDown(e); }

    void OpenDrop()
    {
        if (Items.Count == 0) return;
        var d = new PickerDrop(Items, sel);
        d.Width = Width;
        d.Left = PointToScreen(new Point(0, Height + 6)).X;
        d.Top = PointToScreen(new Point(0, Height + 6)).Y;
        d.FormClosed += (s, e) =>
        {
            if (d.Picked >= 0) SelectedIndex = d.Picked;
        };
        var owner = FindForm();
        if (owner != null) d.Show(owner); else d.Show();
        d.Focus();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        if (Width < 8 || Height < 8) return;
        var r = new Rectangle(0, 0, Width - 1, Height - 1);
        using (var path = Ui.RoundPath(r, 11))
        {
            using (var br = new SolidBrush(hover ? Ui.Hover : Ui.Field))
                g.FillPath(br, path);
            using (var p = new Pen(hover ? Color.FromArgb(140, 124, 92, 255) : Ui.FieldLine))
                g.DrawPath(p, path);
        }
        int sz = 24;
        int sy = (Height - sz) / 2;
        using (var lg = new LinearGradientBrush(new Rectangle(16, sy, sz, sz), Ui.Accent, Ui.Accent2, 45f))
        using (var p2 = Ui.RoundPath(new Rectangle(16, sy, sz, sz), 8))
            g.FillPath(lg, p2);
        using (var wb = new SolidBrush(Color.White))
            Ui.Star(g, 16 + sz / 2f, sy + sz / 2f, 7.5f, wb);

        var m = SelectedItem as ModelInfo;
        string txt = m != null ? m.Name : "选择模型";
        TextRenderer.DrawText(g, txt, Ui.F105B, new Rectangle(50, 0, Width - 86, Height), Ui.Text1,
            TextFormatFlags.Left | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);

        int ax = Width - 26, ay = Height / 2;
        using (var p = new Pen(Ui.Text2, 1.6f))
        {
            g.DrawLine(p, ax - 4, ay - 2, ax, ay + 3);
            g.DrawLine(p, ax, ay + 3, ax + 4, ay - 2);
        }
    }
}

class PickerDrop : Form
{
    List<object> items;
    int sel;
    int hover = -1;
    public int Picked = -1;
    int rowH = 50;

    public PickerDrop(List<object> its, int s)
    {
        items = its;
        sel = s;
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        StartPosition = FormStartPosition.Manual;
        BackColor = Ui.Card;
        DoubleBuffered = true;
        SetStyle(ControlStyles.OptimizedDoubleBuffer | ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint, true);
        Width = 372;
        Height = its.Count * rowH + 20;
        Region = new Region(Ui.RoundPath(new Rectangle(0, 0, Width, Height), 12));
    }

    protected override void OnDeactivate(EventArgs e)
    {
        base.OnDeactivate(e);
        Close();
    }

    int Hit(Point p)
    {
        int i = (p.Y - 10) / rowH;
        if (i < 0) i = 0;
        if (i >= items.Count) i = items.Count - 1;
        return i;
    }

    protected override void OnMouseMove(MouseEventArgs e)
    {
        int h = Hit(e.Location);
        if (h != hover) { hover = h; Invalidate(); }
        base.OnMouseMove(e);
    }
    protected override void OnMouseLeave(EventArgs e) { hover = -1; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnMouseClick(MouseEventArgs e)
    {
        Picked = Hit(e.Location);
        Close();
        base.OnMouseClick(e);
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        using (var br = new SolidBrush(Ui.Card))
        using (var path = Ui.RoundPath(new Rectangle(0, 0, Width, Height), 12))
            g.FillPath(br, path);

        for (int i = 0; i < items.Count; i++)
        {
            var r = new Rectangle(8, 10 + i * rowH, Width - 16, rowH - 4);
            if (i == hover || i == sel)
            {
                using (var br = new SolidBrush(i == hover ? Ui.Hover : Color.FromArgb(28, 34, 54)))
                using (var path = Ui.RoundPath(r, 9))
                    g.FillPath(br, path);
            }
            var m = items[i] as ModelInfo;
            string name = m != null ? m.Name : items[i].ToString();
            string desc = m != null ? m.Desc : "";
            TextRenderer.DrawText(g, name, Ui.F95B, new Rectangle(r.X + 12, r.Y + 6, r.Width - 24, 20),
                i == sel ? Ui.Accent2 : Ui.Text1, TextFormatFlags.Left | TextFormatFlags.EndEllipsis);
            TextRenderer.DrawText(g, desc, Ui.F8, new Rectangle(r.X + 12, r.Y + 26, r.Width - 24, 18),
                Ui.Text2, TextFormatFlags.Left | TextFormatFlags.EndEllipsis);
            if (i == sel)
            {
                int cx = r.Right - 22, cy = r.Y + rowH / 2 - 2;
                using (var p = new Pen(Ui.Accent2, 2f))
                {
                    g.DrawLine(p, cx - 5, cy, cx - 1, cy + 5);
                    g.DrawLine(p, cx - 1, cy + 5, cx + 6, cy - 5);
                }
            }
        }

        using (var p = new Pen(Ui.FieldLine))
        using (var path = Ui.RoundPath(new Rectangle(0, 0, Width - 1, Height - 1), 12))
            g.DrawPath(p, path);
    }
}

class ModelInfo
{
    public string Slug, TaskType, Name, Desc;
    public ModelInfo(string slug, string tt, string name, string desc)
    { Slug = slug; TaskType = tt; Name = name; Desc = desc; }
    public override string ToString() { return Name; }
}

class Cfg
{
    public static string Token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOjIxMTk2NDQzMTY2NTUwNzk0MjYsInJuU3RyIjoiRDlMSjdER0h2OWFRT2V5dEZFcUpqN2N6NENhSVlRN2UiLCJpcCI6IjE4My4yMTguMzYuMTczIiwiYWRkcmVzcyI6IuS4reWbvXzmsZ_opb_nnIF85a6c5pil5biCfOenu-WKqCIsImJyb3dzZXIiOiJDaHJvbWUgMTQwIiwib3MiOiJVbmtub3duIiwibG9naW5UaW1lIjoxNzk0MTk3OTA0fQ.93wIBQY-nNKWQo44B0qiXLprBwjRBfKSscycDxdpKRE";
    public static string TenantId = "2119644316638302210";
    public static string TenantCode = "THtf7Yx14fgV";
    public const string EntityChar = "910141757437563478";
    public const string EntityScene = "910141757731164776";
    public const string EntityStory = "910141757995405936";
    public const string Base = "https://api.dimnx.com/api";
    public static string LastPrompt = "";
    public static int LastMode = 1;
    public static string WinPos = "";
    static string PathCfg;
    public static string DataDir;

    public static void Load()
    {
        var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "DreamVideo");
        Directory.CreateDirectory(root);
        PathCfg = Path.Combine(root, "cfg.ini");
        DataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "绘梦作品");
        Directory.CreateDirectory(Path.Combine(DataDir, "图片"));
        Directory.CreateDirectory(Path.Combine(DataDir, "视频"));

        if (!File.Exists(PathCfg)) { Persist(); return; }
        try
        {
            foreach (var l in File.ReadAllLines(PathCfg))
            {
                var i = l.IndexOf('=');
                if (i <= 0) continue;
                var k = l.Substring(0, i).Trim();
                var v = l.Substring(i + 1).Trim();
                if (v.Length == 0) continue;
                if (k == "token") Token = v;
                else if (k == "tid") TenantId = v;
                else if (k == "tcode") TenantCode = v;
                else if (k == "prompt") LastPrompt = v.Replace("\\n", "\n");
                else if (k == "mode") { int m; if (int.TryParse(v, out m)) LastMode = m; }
                else if (k == "win") WinPos = v;
            }
        }
        catch { }
    }

    public static void Save(string t, string tid, string tc)
    {
        Token = t.Trim(); TenantId = tid.Trim(); TenantCode = tc.Trim();
        Persist();
    }

    public static void Persist()
    {
        try
        {
            File.WriteAllText(PathCfg,
                "token=" + Token + "\r\n" +
                "tid=" + TenantId + "\r\n" +
                "tcode=" + TenantCode + "\r\n" +
                "prompt=" + (LastPrompt ?? "").Replace("\r", "").Replace("\n", "\\n") + "\r\n" +
                "mode=" + LastMode + "\r\n" +
                "win=" + WinPos + "\r\n", Encoding.UTF8);
        }
        catch { }
    }
}

class CfgForm : Form
{
    public TextBox t1, t2, t3;
    public bool Saved = false;

    public CfgForm()
    {
        Text = "登录设置";
        ClientSize = new Size(620, 330);
        StartPosition = FormStartPosition.CenterParent;
        Font = new Font("微软雅黑", 9F);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false; MinimizeBox = false;
        BackColor = Color.White;

        Controls.Add(Ui.Lbl("Token（浏览器 localStorage 的 auth_token）", 18, 14, 560, 22, 9f, Ui.Text2, false));
        t1 = new TextBox
        {
            Left = 18, Top = 40, Width = 584, Height = 96, Multiline = true,
            ScrollBars = ScrollBars.Vertical, Text = Cfg.Token,
            BorderStyle = BorderStyle.FixedSingle, Font = new Font("Consolas", 8F)
        };
        Controls.Add(t1);

        Controls.Add(Ui.Lbl("tenant_id", 18, 148, 240, 22, 9f, Ui.Text2, false));
        t2 = new TextBox { Left = 18, Top = 172, Width = 280, Height = 26, Text = Cfg.TenantId, BorderStyle = BorderStyle.FixedSingle };
        Controls.Add(t2);

        Controls.Add(Ui.Lbl("tenant_code", 320, 148, 240, 22, 9f, Ui.Text2, false));
        t3 = new TextBox { Left = 320, Top = 172, Width = 282, Height = 26, Text = Cfg.TenantCode, BorderStyle = BorderStyle.FixedSingle };
        Controls.Add(t3);

        Controls.Add(Ui.Lbl("获取：登录 huimengi.com → F12 → Console → localStorage.getItem('auth_token')", 18, 208, 584, 22, 8.5f, Ui.Text2, false));

        var ok = new RoundButton { Text = "保 存", Left = 400, Top = 264, Width = 96, Height = 38, Radius = 10 };
        ok.Click += (s, e) => { Cfg.Save(t1.Text, t2.Text, t3.Text); Saved = true; Close(); };
        Controls.Add(ok);

        var cancel = new GhostButton { Text = "取消", Left = 506, Top = 264, Width = 96, Height = 38 };
        cancel.Click += (s, e) => Close();
        Controls.Add(cancel);
    }
}

class MainForm : Form
{
    static readonly HttpClient HC = MakeClient();
    static readonly JavaScriptSerializer JS = new JavaScriptSerializer();
    static HttpClient MakeClient()
    {
        var h = new HttpClientHandler { UseProxy = false, AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate };
        return new HttpClient(h) { Timeout = TimeSpan.FromMinutes(3) };
    }

    // 窗口
    Panel titleBar, body;
    Label lblMin, lblClose;
    Label tabImg, tabVid;
    Panel underline;
    Card cardLeft;
    ModelPicker cbModel;
    Label lblModelDesc;
    Label lblP1, lblP2;
    Seg cbP1, cbP2;
    Label lblFirst, lblFirstHint;
    GhostButton btnPick;
    TextBox txtImg;
    Panel imgBox;
    Panel promptBox;
    Label lblPrompt;
    TextBox txtPrompt;
    GhostButton[] chips;
    Card cardPreview, cardLog;
    PictureBox picPreview;
    Label lblPreviewHint;
    RichTextBox log;
    Panel barBg, barFill;
    Label lblStat, lblPoints;
    RoundButton btnGo;
    GhostButton btnFolder, btnAllModels, btnCfg;

    ModelInfo[] imgModels = new ModelInfo[] {
        new ModelInfo("z-image-turbo", "TEXT_TO_IMAGE_Z_IMAGE_TURBO", "Z-Image Turbo", "速度最快 · 画质均衡，适合草稿与量产"),
        new ModelInfo("seedream-4-5", "TEXT_TO_IMAGE_SEEDREAM_4_5", "Seedream 4.5", "字节火山引擎 · 写实细腻，2K 级细节"),
        new ModelInfo("nanobana-2-1", "TEXT_TO_IMAGE_NANOBANA_2_1", "NanoBanana 2.1", "想象力强 · 风格鲜明，适合创意概念"),
        new ModelInfo("mj-8-2", "TEXT_TO_IMAGE_MJ_8_2", "Midjourney v8.2", "艺术感强 · 氛围与光影出色"),
    };
    ModelInfo[] vidModels = new ModelInfo[] {
        new ModelInfo("seedance-2-0-mini", "IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI", "Seedance 2.0 Mini", "字节 · 4~15 秒 · 480p/720p，图生视频"),
    };

    int mode = 1;          // 0=文生图 1=图生视频
    string imgPath = "";
    string lastVideo = "";
    bool autoMode = false;
    bool busy = false;

    static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "DreamVideo", "run.log");

    int startMode = 1;

    public MainForm() : this(1) { }

    public MainForm(int sm)
    {
        startMode = sm;
        Text = "绘梦工坊 · AI 创作台";
        FormBorderStyle = FormBorderStyle.None;
        ClientSize = new Size(1000, 720);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Ui.Bg;
        Font = new Font("微软雅黑", 9F);
        DoubleBuffered = true;
        Region = new Region(Ui.RoundPath(new Rectangle(0, 0, 1000, 720), 16));

        BuildTitleBar();
        BuildBody();
        ApplyMode(startMode);

        // 恢复上次提示词（图模式默认词不覆盖用户记录）
        if (!string.IsNullOrEmpty(Cfg.LastPrompt)) txtPrompt.Text = Cfg.LastPrompt;

        // 恢复窗口位置（越界则回中心）
        if (!string.IsNullOrEmpty(Cfg.WinPos))
        {
            var p = Cfg.WinPos.Split(',');
            int x, y;
            if (p.Length == 2 && int.TryParse(p[0], out x) && int.TryParse(p[1], out y))
            {
                var scr = Screen.FromPoint(new Point(x + 500, y + 350)).WorkingArea;
                if (scr.IntersectsWith(new Rectangle(x, y, Width, Height)))
                {
                    StartPosition = FormStartPosition.Manual;
                    Location = new Point(x, y);
                }
            }
        }

        // 拖拽图片进窗口 = 选首图
        AllowDrop = true;
        DragEnter += (s, e) =>
        {
            if (e.Data.GetDataPresent(DataFormats.FileDrop)) e.Effect = DragDropEffects.Copy;
        };
        DragDrop += (s, e) =>
        {
            var files = e.Data.GetData(DataFormats.FileDrop) as string[];
            if (files != null && files.Length > 0) SetFirstImage(files[0]);
        };

        // Ctrl+Enter 直接开始生成
        KeyPreview = true;
        KeyDown += (s, e) =>
        {
            if ((e.KeyCode == Keys.F5 || (e.Control && e.KeyCode == Keys.Enter)) && !busy)
            {
                e.SuppressKeyPress = true;
                btnGo.PerformClick();
            }
        };

        FormClosing += (s, e) =>
        {
            Cfg.LastPrompt = txtPrompt.Text;
            Cfg.LastMode = mode;
            Cfg.WinPos = Location.X + "," + Location.Y;
            Cfg.Persist();
        };

        Load += async (s, e) => await SelfCheckAsync();
    }

    // ---------- 顶部标题栏 ----------
    void BuildTitleBar()
    {
        titleBar = new Panel { Left = 0, Top = 0, Width = 1000, Height = 68, BackColor = Color.Transparent };
        titleBar.Paint += (s, e) =>
        {
            var g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;

            using (var lg = new LinearGradientBrush(new Rectangle(32, 18, 34, 34), Ui.Accent, Ui.Accent2, 45f))
            using (var path = Ui.RoundPath(new Rectangle(32, 18, 34, 34), 10))
                g.FillPath(lg, path);
            using (var wb = new SolidBrush(Color.White))
                Ui.Star(g, 49f, 35f, 10.5f, wb);

            using (var p = new Pen(Ui.Line))
                g.DrawLine(p, 0, 67, 1000, 67);

            using (var lg = new LinearGradientBrush(new Rectangle(0, 67, 1000, 1), Color.FromArgb(0, 124, 92, 255), Color.FromArgb(160, 56, 189, 248), 0f))
                g.FillRectangle(lg, new Rectangle(0, 67, 1000, 1));
        };
        Controls.Add(titleBar);

        titleBar.Controls.Add(Ui.Lbl("绘梦工坊", 80, 14, 300, 26, 12.5f, Ui.Text1, true));
        titleBar.Controls.Add(Ui.Lbl("AI 创作台 · 文生图 / 图生视频", 80, 38, 400, 18, 8.5f, Ui.Text2, false));

        lblMin = new Label { Left = 900, Top = 18, Width = 34, Height = 34, BackColor = Color.Transparent, Cursor = Cursors.Hand };
        lblMin.Paint += (s, e) =>
        {
            using (var p = new Pen(lblMin.ForeColor, 1.4f))
                e.Graphics.DrawLine(p, 11, 17, 23, 17);
        };
        lblMin.MouseEnter += (s, e) => { lblMin.ForeColor = Ui.Text1; lblMin.Invalidate(); };
        lblMin.MouseLeave += (s, e) => { lblMin.ForeColor = Ui.Text2; lblMin.Invalidate(); };
        lblMin.ForeColor = Ui.Text2;
        lblMin.Click += (s, e) => WindowState = FormWindowState.Minimized;
        titleBar.Controls.Add(lblMin);

        lblClose = new Label { Left = 942, Top = 18, Width = 34, Height = 34, BackColor = Color.Transparent, Cursor = Cursors.Hand, ForeColor = Ui.Text2 };
        lblClose.Paint += (s, e) =>
        {
            using (var p = new Pen(lblClose.ForeColor, 1.4f))
            {
                e.Graphics.DrawLine(p, 12, 12, 22, 22);
                e.Graphics.DrawLine(p, 22, 12, 12, 22);
            }
        };
        lblClose.MouseEnter += (s, e) => { lblClose.ForeColor = Color.FromArgb(248, 113, 113); lblClose.Invalidate(); };
        lblClose.MouseLeave += (s, e) => { lblClose.ForeColor = Ui.Text2; lblClose.Invalidate(); };
        lblClose.Click += (s, e) => Close();
        titleBar.Controls.Add(lblClose);

        titleBar.MouseDown += (s, e) =>
        {
            if (e.Button == MouseButtons.Left)
            {
                ReleaseCapture();
                SendMessage(Handle, 0xA1, (IntPtr)2, IntPtr.Zero);
            }
        };
    }

    // ---------- 主体 ----------
    void BuildBody()
    {
        body = new Panel { Left = 0, Top = 68, Width = 1000, Height = 652, BackColor = Color.Transparent };
        body.Paint += (s, e) =>
        {
            var g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            DrawGlow(g, 100, 20, 460, Color.FromArgb(30, 124, 92, 255));
            DrawGlow(g, 920, 640, 520, Color.FromArgb(22, 56, 189, 248));
        };
        Controls.Add(body);

        tabImg = Ui.Lbl("文生图", 32, 14, 84, 32, 11f, Ui.Text1, true);
        tabImg.TextAlign = ContentAlignment.MiddleCenter;
        tabImg.Cursor = Cursors.Hand;
        tabImg.Click += (s, e) => ApplyMode(0);
        body.Controls.Add(tabImg);

        tabVid = Ui.Lbl("图生视频", 124, 14, 96, 32, 11f, Ui.Text2, false);
        tabVid.TextAlign = ContentAlignment.MiddleCenter;
        tabVid.Cursor = Cursors.Hand;
        tabVid.Click += (s, e) => ApplyMode(1);
        body.Controls.Add(tabVid);

        underline = new Panel { Left = 32, Top = 50, Width = 84, Height = 3, BackColor = Color.Transparent };
        underline.Paint += (s, e) =>
        {
            if (underline.Width < 4) return;
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (var lg = new LinearGradientBrush(new Rectangle(0, 0, underline.Width, 3), Ui.Accent, Ui.Accent2, 0f))
            using (var path = Ui.RoundPath(new Rectangle(0, 0, underline.Width, 3), 2))
                e.Graphics.FillPath(lg, path);
        };
        body.Controls.Add(underline);

        // ===== 左侧卡片 =====
        cardLeft = new Card { Left = 32, Top = 64, Width = 420, Height = 520 };
        body.Controls.Add(cardLeft);

        cardLeft.Controls.Add(Ui.Lbl("模型", 24, 16, 120, 20, 9.5f, Ui.Text1, true));

        cbModel = new ModelPicker { Left = 24, Top = 38, Width = 372, Height = 48 };
        cbModel.SelectedIndexChanged += (s, e) =>
        {
            var m = cbModel.SelectedItem as ModelInfo;
            lblModelDesc.Text = m != null ? m.Desc : "";
        };
        cardLeft.Controls.Add(cbModel);

        lblModelDesc = Ui.Lbl("", 24, 92, 372, 18, 8.5f, Ui.Text2, false);
        cardLeft.Controls.Add(lblModelDesc);

        cardLeft.Controls.Add(new Panel { Left = 24, Top = 120, Width = 372, Height = 1, BackColor = Ui.Line });
        cardLeft.Controls.Add(Ui.Lbl("参数", 24, 132, 120, 18, 9.5f, Ui.Text1, true));

        lblP1 = Ui.Lbl("画幅", 24, 156, 160, 16, 8.5f, Ui.Text3, false);
        cardLeft.Controls.Add(lblP1);
        cbP1 = new Seg { Left = 24, Top = 176, Width = 372, Height = 36 };
        cardLeft.Controls.Add(cbP1);

        lblP2 = Ui.Lbl("数量", 24, 218, 160, 16, 8.5f, Ui.Text3, false);
        cardLeft.Controls.Add(lblP2);
        cbP2 = new Seg { Left = 24, Top = 238, Width = 372, Height = 36 };
        cardLeft.Controls.Add(cbP2);

        lblFirst = Ui.Lbl("首图（图生视频必填）", 24, 282, 240, 16, 8.5f, Ui.Text3, false);
        cardLeft.Controls.Add(lblFirst);

        btnPick = new GhostButton { Text = "选择图片…", Left = 24, Top = 304, Width = 110, Height = 32 };
        btnPick.Click += BtnPick_Click;
        cardLeft.Controls.Add(btnPick);

        txtImg = new TextBox { ReadOnly = true, Font = Ui.F8 };
        imgBox = Wrap(txtImg, 142, 304, 254, 32);
        cardLeft.Controls.Add(imgBox);

        lblPrompt = Ui.Lbl("提示词", 24, 342, 240, 18, 9.5f, Ui.Text1, true);
        cardLeft.Controls.Add(lblPrompt);

        txtPrompt = new TextBox
        {
            Multiline = true, ScrollBars = ScrollBars.None,
            Font = Ui.F95,
            Text = "黑猫缓缓抬头，霓虹灯光晕缓慢流动，毛发细微飘动，电影级运镜"
        };
        promptBox = Wrap(txtPrompt, 24, 362, 372, 96);
        cardLeft.Controls.Add(promptBox);

        string[] chipTexts = new string[] { "电影感", "赛博朋克", "国风", "产品图" };
        string[] chipAdds = new string[] {
            "，电影级布光，浅景深，35mm 质感",
            "，赛博朋克，霓虹紫青对比，湿润地面反光",
            "，国风水墨意境，留白构图，细腻笔触",
            "，产品级棚拍，柔光箱，纯色背景，高级质感"
        };
        chips = new GhostButton[chipTexts.Length];
        for (int i = 0; i < chipTexts.Length; i++)
        {
            var idx = i;
            var b = new GhostButton { Text = chipTexts[i], Left = 24 + i * 93, Top = 470, Width = 87, Height = 26, Radius = 13 };
            b.Font = Ui.F8;
            b.Click += (s, e) => { txtPrompt.Text = txtPrompt.Text + chipAdds[idx]; txtPrompt.SelectionStart = txtPrompt.Text.Length; };
            chips[i] = b;
            cardLeft.Controls.Add(b);
        }

        // ===== 预览卡片 =====
        cardPreview = new Card { Left = 472, Top = 64, Width = 496, Height = 336 };
        body.Controls.Add(cardPreview);
        cardPreview.Controls.Add(Ui.Lbl("预览", 20, 14, 120, 20, 9.5f, Ui.Text1, true));

        picPreview = new PictureBox
        {
            Left = 20, Top = 42, Width = 456, Height = 250,
            SizeMode = PictureBoxSizeMode.Zoom, BackColor = Ui.Field
        };
        picPreview.Paint += (s, e) =>
        {
            var g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            if (picPreview.Image == null)
            {
                int cx = picPreview.Width / 2, cy = picPreview.Height / 2 - 10;
                using (var br = new SolidBrush(Color.FromArgb(34, 124, 92, 255)))
                    Ui.Star(g, cx, cy, 26f, br);
            }
            using (var p = new Pen(Ui.FieldLine))
                g.DrawRectangle(p, 0, 0, picPreview.Width - 1, picPreview.Height - 1);
        };
        picPreview.Click += (s, e) =>
        {
            if (!string.IsNullOrEmpty(lastVideo) && File.Exists(lastVideo))
            {
                try { System.Diagnostics.Process.Start(lastVideo); } catch (Exception ex) { Say("打开视频失败: " + ex.Message); }
            }
        };
        cardPreview.Controls.Add(picPreview);

        lblPreviewHint = Ui.Lbl("生成完成后作品会显示在这里", 20, 296, 456, 20, 8.5f, Ui.Text2, false);
        lblPreviewHint.TextAlign = ContentAlignment.MiddleCenter;
        cardPreview.Controls.Add(lblPreviewHint);

        // ===== 日志卡片 =====
        cardLog = new Card { Left = 472, Top = 412, Width = 496, Height = 172 };
        body.Controls.Add(cardLog);
        cardLog.Controls.Add(Ui.Lbl("运行日志", 20, 10, 120, 20, 9.5f, Ui.Text1, true));
        var logBox = new Panel { Left = 16, Top = 36, Width = 464, Height = 128, BackColor = Ui.Field };
        logBox.Region = new Region(Ui.RoundPath(new Rectangle(0, 0, logBox.Width, logBox.Height), 10));
        logBox.Paint += (s, e) =>
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (var p = new Pen(Ui.FieldLine))
            using (var path = Ui.RoundPath(new Rectangle(0, 0, logBox.Width - 1, logBox.Height - 1), 10))
                e.Graphics.DrawPath(p, path);
        };
        cardLog.Controls.Add(logBox);
        log = new RichTextBox
        {
            Left = 10, Top = 8, Width = 444, Height = 112,
            ReadOnly = true, BorderStyle = BorderStyle.None,
            BackColor = Ui.Field,
            Font = new Font("Consolas", 8.5F), ForeColor = Color.FromArgb(150, 162, 192)
        };
        logBox.Controls.Add(log);

        // ===== 底部 =====
        barBg = new Panel { Left = 32, Top = 592, Width = 936, Height = 3, BackColor = Color.FromArgb(30, 38, 58) };
        body.Controls.Add(barBg);
        barFill = new Panel { Left = 0, Top = 0, Width = 0, Height = 3, BackColor = Color.Transparent };
        barFill.Paint += (s, e) =>
        {
            if (barFill.Width < 2) return;
            using (var lg = new LinearGradientBrush(new Rectangle(0, 0, barFill.Width, 3), Ui.Accent, Ui.Accent2, 0f))
                e.Graphics.FillRectangle(lg, new Rectangle(0, 0, barFill.Width, 3));
        };
        barBg.Controls.Add(barFill);

        lblStat = Ui.Lbl("就绪", 32, 601, 300, 26, 8.5f, Ui.Text2, false);
        body.Controls.Add(lblStat);

        lblPoints = Ui.Lbl("积分 --", 340, 601, 140, 26, 8.5f, Ui.Text2, false);
        body.Controls.Add(lblPoints);

        btnCfg = new GhostButton { Text = "登录设置", Left = 490, Top = 598, Width = 96, Height = 32 };
        btnCfg.Click += (s, e) => { using (var f = new CfgForm()) { f.ShowDialog(this); if (f.Saved) Say("登录信息已更新"); } };
        body.Controls.Add(btnCfg);

        btnFolder = new GhostButton { Text = "打开作品夹", Left = 594, Top = 598, Width = 112, Height = 32 };
        btnFolder.Click += (s, e) => System.Diagnostics.Process.Start("explorer.exe", Cfg.DataDir);
        body.Controls.Add(btnFolder);

        btnAllModels = new GhostButton { Text = "全部模型", Left = 714, Top = 598, Width = 96, Height = 32 };
        btnAllModels.Click += (s, e) => ShowModels();
        body.Controls.Add(btnAllModels);

        btnGo = new RoundButton
        {
            Text = "开始生成", Left = 818, Top = 592, Width = 150, Height = 40,
            Font = Ui.F11B, Radius = 13
        };
        btnGo.Click += async (s, e) => await RunAsync();
        body.Controls.Add(btnGo);
    }

    void ApplyMode(int m)
    {
        mode = m;
        bool isVid = m == 1;

        tabImg.ForeColor = isVid ? Ui.Text2 : Ui.Text1;
        tabVid.ForeColor = isVid ? Ui.Text1 : Ui.Text2;
        tabImg.Font = isVid ? new Font("微软雅黑", 11f) : new Font("微软雅黑", 11f, FontStyle.Bold);
        tabVid.Font = isVid ? new Font("微软雅黑", 11f, FontStyle.Bold) : new Font("微软雅黑", 11f);
        underline.Left = isVid ? 124 : 32;
        underline.Width = isVid ? 96 : 84;
        underline.Invalidate();

        cbModel.Items.Clear();
        foreach (var x in (isVid ? vidModels : imgModels)) cbModel.Items.Add(x);
        cbModel.SelectedIndex = 0;
        cbModel.Invalidate();
        var mm = cbModel.SelectedItem as ModelInfo;
        lblModelDesc.Text = mm != null ? mm.Desc : "";

        cbP1.Items.Clear();
        cbP2.Items.Clear();
        if (isVid)
        {
            cbP1.Items.AddRange(new string[] { "4 秒", "5 秒", "10 秒", "15 秒" });
            cbP2.Items.AddRange(new string[] { "480p 省积分", "720p 高清" });
        }
        else
        {
            cbP1.Items.AddRange(new string[] { "16:9 横屏", "9:16 竖屏", "1:1 方形", "4:3 经典" });
            cbP2.Items.AddRange(new string[] { "1 张", "2 张", "4 张" });
        }
        cbP1.SelectedIndex = isVid ? 2 : 0;
        cbP2.SelectedIndex = isVid ? 1 : 0;
        cbP1.Invalidate();
        cbP2.Invalidate();

        lblP1.Text = isVid ? "时长" : "画幅";
        lblP2.Text = isVid ? "清晰度" : "数量";

        lblFirst.Visible = isVid;
        btnPick.Visible = isVid;
        imgBox.Visible = isVid;

        int pTop = isVid ? 340 : 288;
        int boxTop = pTop + 20;
        int boxBottom = 462;
        lblPrompt.Top = pTop;
        promptBox.Top = boxTop;
        promptBox.Height = boxBottom - boxTop;
        txtPrompt.Height = promptBox.Height - 12;

        if (!isVid)
        {
            txtPrompt.Text = "一只赛博朋克风格的黑猫，霓虹灯，电影感";
        }
        btnGo.Text = isVid ? "开始生成视频" : "开始生成图片";
    }

    // ---------- 通用 ----------
    static void DrawGlow(Graphics g, int cx, int cy, int r, Color c)
    {
        try
        {
            var path = new GraphicsPath();
            path.AddEllipse(cx - r, cy - r, r * 2, r * 2);
            using (var pgb = new PathGradientBrush(path))
            {
                pgb.CenterColor = c;
                pgb.SurroundColors = new Color[] { Color.FromArgb(0, c) };
                pgb.FocusScales = new PointF(0.2f, 0.2f);
                g.FillPath(pgb, path);
            }
            path.Dispose();
        }
        catch { }
    }

    Panel Wrap(TextBox inner, int x, int y, int w, int h)
    {
        var pan = new Panel { Left = x, Top = y, Width = w, Height = h, BackColor = Ui.Field };
        pan.Paint += (s, e) =>
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (var path = Ui.RoundPath(new Rectangle(0, 0, pan.Width - 1, pan.Height - 1), 9))
            using (var p = new Pen(Ui.FieldLine))
                e.Graphics.DrawPath(p, path);
        };
        inner.Left = 10; inner.Top = 6; inner.Width = w - 20; inner.Height = h - 12;
        inner.BorderStyle = BorderStyle.None;
        inner.BackColor = Ui.Field;
        inner.ForeColor = Ui.Text1;
        pan.Controls.Add(inner);
        return pan;
    }

    void Say(string s)
    {
        if (InvokeRequired) { BeginInvoke(new Action<string>(Say), s); return; }
        var line = "[" + DateTime.Now.ToString("HH:mm:ss") + "] " + s;
        log.AppendText(line + "\r\n");
        log.ScrollToCaret();
        try { File.AppendAllText(LogPath, line + "\r\n", Encoding.UTF8); } catch { }
    }

    void Stat(string s)
    {
        if (InvokeRequired) { BeginInvoke(new Action<string>(Stat), s); return; }
        lblStat.Text = s;
    }

    void Prog(int v)
    {
        if (InvokeRequired) { BeginInvoke(new Action<int>(Prog), v); return; }
        v = Math.Max(0, Math.Min(100, v));
        barFill.Width = barBg.Width * v / 100;
    }

    HttpRequestMessage Req(HttpMethod m, string path)
    {
        var r = new HttpRequestMessage(m, Cfg.Base + path);
        r.Headers.Add("authorization", "Bearer " + Cfg.Token);
        r.Headers.Add("x-tenant-id", Cfg.TenantId);
        r.Headers.Add("x-tenant-code", Cfg.TenantCode);
        return r;
    }

    Dictionary<string, object> Parse(string s)
    {
        try { return JS.Deserialize<Dictionary<string, object>>(s); } catch { return new Dictionary<string, object>(); }
    }

    static string GetStr(Dictionary<string, object> d, string k)
    {
        object v;
        if (d != null && d.TryGetValue(k, out v) && v != null) return v.ToString();
        return null;
    }

    static string DeepStr(object root, params string[] path)
    {
        object cur = root;
        foreach (var k in path)
        {
            var m = cur as Dictionary<string, object>;
            if (m == null) return null;
            object nv;
            if (!m.TryGetValue(k, out nv)) return null;
            cur = nv;
        }
        return cur == null ? null : cur.ToString();
    }

    static string TaskIdOf(Dictionary<string, object> d)
    {
        object dv;
        if (d == null || !d.ContainsKey("data")) return null;
        if (!d.TryGetValue("data", out dv) || dv == null) return null;
        var lst = dv as System.Collections.IList;
        if (lst != null) return lst.Count > 0 ? lst[0].ToString() : null;
        return dv.ToString().Trim();
    }

    async Task<int> BalanceAsync()
    {
        try
        {
            var r = await HC.SendAsync(Req(HttpMethod.Get, "/billing/points"));
            var t = await r.Content.ReadAsStringAsync();
            var d = Parse(t);
            object data;
            if (d.TryGetValue("data", out data))
            {
                var m = data as Dictionary<string, object>;
                var p = GetStr(m, "points");
                if (p != null) return (int)double.Parse(p);
            }
        }
        catch { }
        return -1;
    }

    async Task ShowPointsAsync()
    {
        int b = await BalanceAsync();
        if (InvokeRequired) { BeginInvoke(new Action<int>(SetPoints), b); return; }
        SetPoints(b);
    }

    void SetPoints(int b)
    {
        lblPoints.Text = b >= 0 ? ("积分 " + b) : "积分 --";
    }

    async Task SelfCheckAsync()
    {
        Stat("正在连接服务器…");
        try
        {
            var r = await HC.SendAsync(Req(HttpMethod.Get, "/billing/points"));
            var t = await r.Content.ReadAsStringAsync();
            if (t.Contains("\"code\":\"0\""))
            {
                int b = await BalanceAsync();
                SetPoints(b);
                Say("服务器连接正常，当前积分: " + b);
                Stat("就绪");
            }
            else
            {
                Say("连接异常 HTTP " + (int)r.StatusCode + " " + t.Substring(0, Math.Min(160, t.Length)));
                Say("若是登录过期，点左下「登录设置」换 Token");
                Stat("连接异常");
            }
        }
        catch (Exception ex)
        {
            var x = ex; while (x.InnerException != null) x = x.InnerException;
            Say("连不上服务器: " + x.Message);
            Say("检查网络/代理，或点左下「登录设置」更新 Token");
            Stat("连接失败");
        }
    }

    // ---------- 模型清单弹窗 ----------
    void ShowModels()
    {
        string[][] rows = new string[][] {
            new string[] { "Z-Image Turbo", "文生图", "可用", "速度最快，画质均衡" },
            new string[] { "Seedream 4.5", "文生图", "可用", "火山引擎，写实细腻，2K 级细节" },
            new string[] { "NanoBanana 2.1", "文生图", "可用", "创意概念，风格鲜明" },
            new string[] { "Midjourney v8.2", "文生图", "可用", "艺术氛围，光影出色" },
            new string[] { "GPT-Image 2", "文生图", "渠道未开通", "后端未配置渠道" },
            new string[] { "Image 2.5 Flare", "文生图", "渠道未开通", "后端未配置渠道" },
            new string[] { "Image 2.5 Sunburst", "文生图", "渠道未开通", "后端未配置渠道" },
            new string[] { "NanoBanana Pro", "文生图", "渠道未开通", "后端未配置渠道" },
            new string[] { "NanoBanana 2", "文生图", "渠道未开通", "后端未配置渠道" },
            new string[] { "Seedream 5.0 Pro", "文生图", "参数异常", "后端参数校验失败" },
            new string[] { "Qwen Image 3.0", "文生图", "参数异常", "后端参数校验失败" },
            new string[] { "Seedance 2.0 Mini", "图生视频", "可用", "4~15 秒，480p/720p，本机唯一可跑" },
            new string[] { "Seedance 2.0", "图生视频", "积分不足", "预扣高于当前余额" },
            new string[] { "Kling v4 / v3", "图生视频", "渠道未开通", "后端未配置渠道" },
            new string[] { "Wan 3.0 / 2.6", "图生视频", "渠道未开通", "后端未配置渠道" },
            new string[] { "Hailuo 2.3 / 2.0", "图生视频", "渠道未开通", "后端未配置渠道" },
            new string[] { "Vidu Q4 / Q2", "图生视频", "渠道未开通", "后端未配置渠道" },
            new string[] { "MiniMax H3", "图生视频", "渠道未开通", "后端未配置渠道" },
            new string[] { "Grok 1.5 Video", "图生视频", "渠道未开通", "后端未配置渠道" }
        };

        var f = new Form
        {
            Text = "全部模型",
            ClientSize = new Size(700, 584),
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.FixedSingle,
            MaximizeBox = false, MinimizeBox = false,
            BackColor = Ui.Bg, ForeColor = Ui.Text1,
            Font = Ui.F9
        };

        var outer = new Panel { Left = 0, Top = 0, Width = 700, Height = 524, AutoScroll = true, BackColor = Ui.Bg };
        var inner = new Panel { Left = 0, Top = 0, Width = 664, Height = rows.Length * 58 + 24, BackColor = Ui.Bg };
        inner.Paint += (s, e) =>
        {
            var g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            int y = 14;
            for (int i = 0; i < rows.Length; i++)
            {
                var row = rows[i];
                var r = new Rectangle(16, y, 630, 48);
                using (var path = Ui.RoundPath(r, 10))
                {
                    using (var br = new SolidBrush(Color.FromArgb(22, 28, 48))) g.FillPath(br, path);
                    using (var p = new Pen(Ui.Line)) g.DrawPath(p, path);
                }
                bool ok = row[2] == "可用";
                Color dot = ok ? Ui.Ok : (row[2] == "积分不足" ? Ui.Warn : Color.FromArgb(88, 98, 126));
                using (var br = new SolidBrush(dot))
                    g.FillEllipse(br, r.X + 16, r.Y + 20, 8, 8);
                TextRenderer.DrawText(g, row[0], Ui.F95B, new Rectangle(r.X + 34, r.Y + 6, 300, 20), Ui.Text1,
                    TextFormatFlags.Left | TextFormatFlags.EndEllipsis);
                TextRenderer.DrawText(g, row[3], Ui.F8, new Rectangle(r.X + 34, r.Y + 26, 380, 18), Ui.Text2,
                    TextFormatFlags.Left | TextFormatFlags.EndEllipsis);
                TextRenderer.DrawText(g, row[1] + " · " + row[2], Ui.F8, new Rectangle(r.Right - 200, r.Y + 14, 184, 20),
                    ok ? Ui.Ok : Color.FromArgb(120, 130, 158), TextFormatFlags.Right);
                y += 58;
            }
        };
        outer.Controls.Add(inner);
        f.Controls.Add(outer);

        var ok2 = new RoundButton { Text = "关 闭", Left = 552, Top = 536, Width = 128, Height = 38 };
        ok2.Click += (s, e) => f.Close();
        f.Controls.Add(ok2);

        f.ShowDialog(this);
    }

    void BtnPick_Click(object sender, EventArgs e)
    {
        using (var d = new OpenFileDialog())
        {
            d.Filter = "图片文件|*.png;*.jpg;*.jpeg;*.webp;*.bmp|所有文件|*.*";
            if (d.ShowDialog() == DialogResult.OK) SetFirstImage(d.FileName);
        }
    }

    void SetFirstImage(string path)
    {
        if (string.IsNullOrEmpty(path) || !File.Exists(path)) return;
        var ext = Path.GetExtension(path).ToLowerInvariant();
        if (ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".webp" && ext != ".bmp")
        {
            Say("不支持的图片格式: " + ext);
            return;
        }
        if (mode != 1)
        {
            Say("首图只用于图生视频，请先切到「图生视频」");
            return;
        }
        imgPath = path;
        txtImg.Text = path;
        try
        {
            using (var fs = File.OpenRead(path))
            {
                var old = picPreview.Image;
                picPreview.Image = Image.FromStream(fs);
                if (old != null) old.Dispose();
            }
        }
        catch { }
        lblPreviewHint.Text = "首图已就绪：" + Path.GetFileName(path);
        Say("已选择首图: " + Path.GetFileName(path));
    }

    // ---------- 上传 ----------
    static string MimeOf(string f)
    {
        var e = Path.GetExtension(f).ToLowerInvariant();
        if (e == ".png") return "image/png";
        if (e == ".webp") return "image/webp";
        if (e == ".bmp") return "image/bmp";
        return "image/jpeg";
    }

    async Task<string> UploadAsync(string file)
    {
        var body = JS.Serialize(new Dictionary<string, object> {
            { "fileName", Path.GetFileName(file) },
            { "contentType", MimeOf(file) }
        });
        var req = Req(HttpMethod.Post, "/styles/image/prepare");
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");
        var resp = await HC.SendAsync(req);
        var txt = await resp.Content.ReadAsStringAsync();
        var d = Parse(txt);
        if (GetStr(d, "code") != "0") throw new Exception("获取上传地址失败: " + txt);
        var url = GetStr(d, "data");
        Say("已获取上传地址");

        var bytes = File.ReadAllBytes(file);
        var put = new HttpRequestMessage(HttpMethod.Put, url);
        put.Content = new ByteArrayContent(bytes);
        put.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(MimeOf(file));
        var pr = await HC.SendAsync(put);
        if (!pr.IsSuccessStatusCode) throw new Exception("上传失败 HTTP " + (int)pr.StatusCode);

        var pub = new Uri(url).GetLeftPart(UriPartial.Path);
        Say("首图已上传");
        return pub;
    }

    // ---------- 主流程 ----------
    async Task RunAsync()
    {
        if (busy) return;
        var m = cbModel.SelectedItem as ModelInfo;
        if (m == null) { MessageBox.Show("请先选择模型"); return; }
        var prompt = txtPrompt.Text.Trim();
        if (prompt.Length == 0) { MessageBox.Show("请先填写提示词"); return; }
        if (mode == 1 && (imgPath.Length == 0 || !File.Exists(imgPath)))
        {
            MessageBox.Show("图生视频需要先选一张首图");
            return;
        }

        busy = true;
        btnGo.Enabled = false; btnPick.Enabled = false; btnCfg.Enabled = false;
        log.Clear();
        try
        {
            int bal0 = await BalanceAsync();
            SetPoints(bal0);
            if (bal0 >= 0) Say("当前积分: " + bal0);

            if (mode == 0) await RunImageAsync(m, prompt, bal0);
            else await RunVideoAsync(m, prompt, bal0);

            await ShowPointsAsync();
            Say("=== 完成 ===");
        }
        catch (Exception ex)
        {
            var x = ex; while (x.InnerException != null) x = x.InnerException;
            Stat("出错");
            Say("错误: " + x.Message);
            if (!autoMode) MessageBox.Show(x.Message, "出错", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
        finally
        {
            busy = false;
            btnGo.Enabled = true; btnPick.Enabled = true; btnCfg.Enabled = true;
        }
    }

    async Task RunImageAsync(ModelInfo m, string prompt, int bal0)
    {
        var ratios = new string[] { "16:9", "9:16", "1:1", "4:3" };
        var counts = new int[] { 1, 2, 4 };
        string ratio = ratios[Math.Max(0, cbP1.SelectedIndex)];
        int count = counts[Math.Max(0, cbP2.SelectedIndex)];

        Prog(10); Stat("提交任务…");
        var payload = new Dictionary<string, object> {
            { "taskType", m.TaskType },
            { "entityType", "character" },
            { "entityId", Cfg.EntityChar },
            { "count", count },
            { "config", new Dictionary<string, object> { { "prompt", prompt }, { "aspectRatio", ratio } } }
        };
        var req = Req(HttpMethod.Post, "/aigc/text-to-image/" + m.Slug);
        req.Content = new StringContent(JS.Serialize(payload), Encoding.UTF8, "application/json");
        var resp = await HC.SendAsync(req);
        var txt = await resp.Content.ReadAsStringAsync();
        var d = Parse(txt);
        if (GetStr(d, "code") != "0") throw new Exception("提交失败: " + txt.Substring(0, Math.Min(300, txt.Length)));
        var taskId = TaskIdOf(d);
        if (taskId == null) throw new Exception("未拿到任务ID");
        Say("任务已提交: " + taskId);

        Prog(20); Stat("生成中…");
        List<string> urls = null;
        string status = "";
        for (int i = 0; i < 90; i++)
        {
            await Task.Delay(4000);
            var g = Req(HttpMethod.Get, "/tasks/" + taskId);
            var gr = await HC.SendAsync(g);
            var gd = Parse(await gr.Content.ReadAsStringAsync());
            object data;
            if (!gd.TryGetValue("data", out data)) continue;
            status = DeepStr(data, "status");
            var one = DeepStr(data, "output_data", "result_response", "result", "image_url");
            if (one != null) urls = new List<string> { one };
            if (urls == null)
            {
                var ud = DeepStr(data, "output_data", "result_response", "result", "image_urls");
                if (ud != null && ud != "") urls = new List<string> { ud };
            }
            Prog(20 + Math.Min(50, i));
            Stat("生成中… " + status + " " + (i * 4) + "s");
            if (i % 3 == 0) Say("状态 " + status + " · " + (i * 4) + "s");
            if (urls != null) break;
            if (status == "FAILED") { Say("任务失败: " + DeepStr(data, "error_message")); break; }
        }
        if (urls == null || urls.Count == 0) throw new Exception("没拿到图片地址（状态: " + status + "）");

        Prog(80); Stat("下载中…");
        string dir = Path.Combine(Cfg.DataDir, "图片");
        string stamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        string firstPath = null;
        int idx = 1;
        foreach (var u in urls)
        {
            if (u == null || u.Trim().Length == 0) continue;
            var bin = await HC.GetByteArrayAsync(u.Trim());
            var f = Path.Combine(dir, "img_" + stamp + "_" + idx + ".png");
            File.WriteAllBytes(f, bin);
            if (firstPath == null) firstPath = f;
            Say("已保存: " + Path.GetFileName(f) + " (" + (bin.Length / 1024) + " KB)");
            idx++;
        }
        Prog(100);
        if (status == "FAILED") { Stat("完成（任务标记失败，但已取回产出）"); Say("注：服务端任务状态为 FAILED，但产物已取回，属其常见现象"); }
        else Stat("完成");
        if (firstPath != null) ShowImage(firstPath);
        if (idx > 2) Say("本次共保存 " + (idx - 1) + " 张");
        lblPreviewHint.Text = "作品已保存到 桌面\\绘梦作品\\图片（共 " + Math.Max(1, idx - 1) + " 张）";
        if (bal0 >= 0) { int bal1 = await BalanceAsync(); if (bal1 >= 0) Say("积分: " + bal0 + " → " + bal1); }
    }

    async Task RunVideoAsync(ModelInfo m, string prompt, int bal0)
    {
        int dur = new int[] { 4, 5, 10, 15 }[Math.Max(0, cbP1.SelectedIndex)];
        string res = cbP2.SelectedIndex == 0 ? "480p" : "720p";

        Prog(6); Stat("上传首图…");
        string imgUrl = await UploadAsync(imgPath);

        Prog(16); Stat("提交任务…");
        var cfg = new Dictionary<string, object> {
            { "prompt", prompt }, { "duration", dur }, { "resolution", res }, { "firstImage", imgUrl }
        };
        var payload = new Dictionary<string, object> {
            { "taskType", m.TaskType },
            { "entityType", "storyboard" },
            { "entityId", Cfg.EntityStory },
            { "count", 1 },
            { "config", cfg }
        };
        var req = Req(HttpMethod.Post, "/aigc/image-to-video/" + m.Slug);
        req.Content = new StringContent(JS.Serialize(payload), Encoding.UTF8, "application/json");
        var resp = await HC.SendAsync(req);
        var txt = await resp.Content.ReadAsStringAsync();
        var d = Parse(txt);
        if (GetStr(d, "code") != "0")
        {
            var msg = GetStr(d, "msg");
            if (msg != null && msg.Contains("积分"))
                throw new Exception(msg + "\n\n提示：把时长改 4 秒或清晰度改 480p，预扣会少一些。");
            throw new Exception("提交失败: " + txt.Substring(0, Math.Min(300, txt.Length)));
        }
        var taskId = TaskIdOf(d);
        if (taskId == null) throw new Exception("未拿到任务ID");
        Say("任务已提交: " + taskId);

        Prog(25); Stat("生成中…");
        string vurl = null;
        string status = "";
        for (int i = 0; i < 150; i++)
        {
            await Task.Delay(4000);
            var g = Req(HttpMethod.Get, "/tasks/" + taskId);
            var gr = await HC.SendAsync(g);
            var gd = Parse(await gr.Content.ReadAsStringAsync());
            object data;
            if (!gd.TryGetValue("data", out data)) continue;
            status = DeepStr(data, "status");
            vurl = DeepStr(data, "output_data", "result_response", "result", "video_url");
            Prog(25 + Math.Min(55, i));
            Stat("生成中… " + status + " " + (i * 4) + "s");
            if (i % 3 == 0) Say("状态 " + status + " · " + (i * 4) + "s");
            if (vurl != null) break;
            if (status == "FAILED") { Say("任务失败: " + DeepStr(data, "error_message")); break; }
        }
        if (vurl == null) throw new Exception("没拿到视频地址（状态: " + status + "）");

        Prog(85); Stat("下载视频…");
        Say("拿到视频地址，开始下载");
        var bytes = await HC.GetByteArrayAsync(vurl);
        var name = "video_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + "_" + res + "_" + dur + "s.mp4";
        var path = Path.Combine(Path.Combine(Cfg.DataDir, "视频"), name);
        File.WriteAllBytes(path, bytes);
        Prog(100); Stat("完成");
        Say("已保存: " + Path.GetFileName(path) + " (" + (bytes.Length / 1048576.0).ToString("0.00") + " MB)");
        lastVideo = path;
        picPreview.Cursor = Cursors.Hand;
        lblPreviewHint.Text = "视频已生成：" + Path.GetFileName(path) + "（点预览区播放）";
        if (bal0 >= 0) { int bal1 = await BalanceAsync(); if (bal1 >= 0) Say("积分: " + bal0 + " → " + bal1); }

        if (autoMode) return;
        if (MessageBox.Show("视频生成完成，是否立即播放？\n" + path, "完成", MessageBoxButtons.YesNo) == DialogResult.Yes)
            System.Diagnostics.Process.Start(path);
    }

    void ShowImage(string path)
    {
        try
        {
            var bytes = File.ReadAllBytes(path);
            using (var ms = new MemoryStream(bytes)) { picPreview.Image = Image.FromStream(ms); }
            picPreview.SizeMode = PictureBoxSizeMode.Zoom;
        }
        catch { }
    }

    // ---------- 自动测试 ----------
    public async void AutoStart(string img, string prompt, int md)
    {
        autoMode = true;
        ApplyMode(md);
        imgPath = img;
        txtImg.Text = img;
        txtPrompt.Text = prompt;
        if (md == 1) { cbP1.SelectedIndex = 0; cbP2.SelectedIndex = 0; }
        try { using (var fs = File.OpenRead(img)) { picPreview.Image = Image.FromStream(fs); } } catch { }
        await RunAsync();
        Application.Exit();
    }

    // ---------- 窗口消息 ----------
    [DllImport("user32.dll")]
    static extern bool ReleaseCapture();
    [DllImport("user32.dll")]
    static extern IntPtr SendMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);

    static void LogCrash(Exception ex)
    {
        try
        {
            File.AppendAllText(LogPath,
                "[" + DateTime.Now.ToString("HH:mm:ss") + "] CRASH: " + (ex == null ? "unknown" : ex.ToString()) + "\r\n", Encoding.UTF8);
        }
        catch { }
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        using (var p = new Pen(Color.FromArgb(222, 226, 236)))
        using (var path = Ui.RoundPath(new Rectangle(0, 0, Width - 1, Height - 1), 14))
            e.Graphics.DrawPath(p, path);
    }

    [STAThread]
    static void Main()
    {
        try { ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)12288; }
        catch { ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; }
        Cfg.Load();
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.ThreadException += (s, e) => LogCrash(e.Exception);
        AppDomain.CurrentDomain.UnhandledException += (s, e) => LogCrash(e.ExceptionObject as Exception);

        var a = Environment.GetCommandLineArgs();
        int sm = Cfg.LastMode;
        if (a.Length >= 2) sm = a[1] == "--img" ? 0 : 1;
        var f = new MainForm(sm);
        if (a.Length >= 3 && a[1] == "--auto")
        {
            var img = a[2];
            var pr = a.Length > 3 ? a[3] : "黑猫缓缓抬头，霓虹灯光晕缓慢流动，毛发细微飘动，电影级运镜";
            var md = (a.Length > 4 && a[4] == "img") ? 0 : 1;
            f.Shown += (s, e) => f.AutoStart(img, pr, md);
        }
        Application.Run(f);
    }
}