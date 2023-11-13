namespace FHE.src.clouds
{
    partial class FourierTransformService
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.groupBox_log = new System.Windows.Forms.GroupBox();
            this.richTextBox_log = new System.Windows.Forms.RichTextBox();
            this.groupBox_log.SuspendLayout();
            this.SuspendLayout();
            // 
            // groupBox_log
            // 
            this.groupBox_log.Controls.Add(this.richTextBox_log);
            this.groupBox_log.Font = new System.Drawing.Font("맑은 고딕", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.groupBox_log.Location = new System.Drawing.Point(12, 12);
            this.groupBox_log.Name = "groupBox_log";
            this.groupBox_log.Size = new System.Drawing.Size(501, 546);
            this.groupBox_log.TabIndex = 10;
            this.groupBox_log.TabStop = false;
            this.groupBox_log.Text = "Process log";
            // 
            // richTextBox_log
            // 
            this.richTextBox_log.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.richTextBox_log.Font = new System.Drawing.Font("맑은 고딕", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.richTextBox_log.Location = new System.Drawing.Point(9, 31);
            this.richTextBox_log.Name = "richTextBox_log";
            this.richTextBox_log.Size = new System.Drawing.Size(484, 509);
            this.richTextBox_log.TabIndex = 8;
            this.richTextBox_log.Text = "";
            // 
            // FourierTransformService
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(532, 570);
            this.Controls.Add(this.groupBox_log);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "FourierTransformService";
            this.Text = "FourierTransformApplication";
            this.groupBox_log.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private GroupBox groupBox_log;
        private RichTextBox richTextBox_log;
    }
}