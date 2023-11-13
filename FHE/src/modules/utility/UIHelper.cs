

namespace FHE.src.modules.utility
{
    internal class UIHelper
    {
        public enum TextBoxUpdateType
        {
            Append, // 텍스트 추가
            Overwrite // 텍스트 덮어쓰기 (초기화 후 업데이트)
        }

        private static void UpdateTextBox<T>(T textbox, string text, bool appendNewLine, TextBoxUpdateType updateType, Color? textColor = null) where T : Control
        {
            if (!(textbox is TextBox || textbox is RichTextBox))
            {
                throw new ArgumentException("Only TextBox and RichTextBox are supported.");
            }

            Action updateAction = () =>
            {
                if (updateType == TextBoxUpdateType.Overwrite)
                {
                    textbox.Text = "";
                }

                textColor = textColor ?? Color.Black;
                if (textbox is RichTextBox rtb && textColor.HasValue)
                {
                    int originalStart = rtb.SelectionStart;
                    rtb.SelectionStart = rtb.TextLength;
                    rtb.SelectionLength = 0;
                    rtb.SelectionColor = textColor.Value;
                    rtb.AppendText(text + (appendNewLine ? Environment.NewLine : ""));
                    rtb.SelectionColor = rtb.ForeColor;
                    rtb.SelectionStart = originalStart + text.Length;
                    rtb.SelectionLength = 0;
                    rtb.ScrollToCaret();
                }
                else if (textbox is TextBox tb)
                {
                    int originalStart = tb.SelectionStart;
                    tb.Text += text + (appendNewLine ? Environment.NewLine : "");
                    tb.SelectionStart = originalStart + text.Length;
                    tb.SelectionLength = 0;
                    tb.ScrollToCaret();
                }
            };

            if (textbox.InvokeRequired) textbox.Invoke(updateAction);
            else updateAction();
        }

        public static void UpdateText<T>(T textbox, string text, TextBoxUpdateType updateType = TextBoxUpdateType.Append, Color? textColor = null) where T : Control
        {
            UpdateTextBox(textbox, text, false, updateType, textColor);
        }

        public static void UpdateTextln<T>(T textbox, string text, TextBoxUpdateType updateType = TextBoxUpdateType.Append, Color? textColor = null) where T : Control
        {
            UpdateTextBox(textbox, text, true, updateType, textColor);
        }

        public static void AppendNewLine<T>(T textbox) where T : Control
        {
            UpdateTextln(textbox, "", TextBoxUpdateType.Append);
        }

        public static void ClearText<T>(T textbox) where T : Control
        {
            UpdateTextln(textbox, "", TextBoxUpdateType.Overwrite);
        }
    }

}
