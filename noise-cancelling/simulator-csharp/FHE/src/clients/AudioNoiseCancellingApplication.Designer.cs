namespace FHE.src.clients
{
    partial class AudioNoiseCancellingApplication
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
            this.group_cancelling = new System.Windows.Forms.GroupBox();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.radioButton_encryptFFT = new System.Windows.Forms.RadioButton();
            this.radioButton_encryptDFT = new System.Windows.Forms.RadioButton();
            this.button_cancelling = new System.Windows.Forms.Button();
            this.richTextBox_log = new System.Windows.Forms.RichTextBox();
            this.groupBox_log = new System.Windows.Forms.GroupBox();
            this.group_cancelling.SuspendLayout();
            this.groupBox1.SuspendLayout();
            this.groupBox_log.SuspendLayout();
            this.SuspendLayout();
            // 
            // group_cancelling
            // 
            this.group_cancelling.Controls.Add(this.groupBox1);
            this.group_cancelling.Controls.Add(this.button_cancelling);
            this.group_cancelling.Font = new System.Drawing.Font("맑은 고딕", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.group_cancelling.Location = new System.Drawing.Point(12, 12);
            this.group_cancelling.Name = "group_cancelling";
            this.group_cancelling.Size = new System.Drawing.Size(501, 196);
            this.group_cancelling.TabIndex = 10;
            this.group_cancelling.TabStop = false;
            this.group_cancelling.Text = "Audio Noise Cancelling";
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.radioButton_encryptFFT);
            this.groupBox1.Controls.Add(this.radioButton_encryptDFT);
            this.groupBox1.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.groupBox1.Location = new System.Drawing.Point(23, 45);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(454, 59);
            this.groupBox1.TabIndex = 11;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Model";
            // 
            // radioButton_encryptFFT
            // 
            this.radioButton_encryptFFT.AutoSize = true;
            this.radioButton_encryptFFT.Cursor = System.Windows.Forms.Cursors.Hand;
            this.radioButton_encryptFFT.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.radioButton_encryptFFT.Location = new System.Drawing.Point(84, 22);
            this.radioButton_encryptFFT.Name = "radioButton_encryptFFT";
            this.radioButton_encryptFFT.Size = new System.Drawing.Size(114, 24);
            this.radioButton_encryptFFT.TabIndex = 8;
            this.radioButton_encryptFFT.TabStop = true;
            this.radioButton_encryptFFT.Text = "FFT (Encrypt)";
            this.radioButton_encryptFFT.UseVisualStyleBackColor = true;
            // 
            // radioButton_encryptDFT
            // 
            this.radioButton_encryptDFT.AutoSize = true;
            this.radioButton_encryptDFT.Cursor = System.Windows.Forms.Cursors.Hand;
            this.radioButton_encryptDFT.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.radioButton_encryptDFT.Location = new System.Drawing.Point(239, 24);
            this.radioButton_encryptDFT.Name = "radioButton_encryptDFT";
            this.radioButton_encryptDFT.Size = new System.Drawing.Size(118, 24);
            this.radioButton_encryptDFT.TabIndex = 9;
            this.radioButton_encryptDFT.TabStop = true;
            this.radioButton_encryptDFT.Text = "DFT (Encrypt)";
            this.radioButton_encryptDFT.UseVisualStyleBackColor = true;
            // 
            // button_cancelling
            // 
            this.button_cancelling.Cursor = System.Windows.Forms.Cursors.Hand;
            this.button_cancelling.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.button_cancelling.Location = new System.Drawing.Point(23, 124);
            this.button_cancelling.Name = "button_cancelling";
            this.button_cancelling.Size = new System.Drawing.Size(454, 53);
            this.button_cancelling.TabIndex = 4;
            this.button_cancelling.Text = "Cancelling";
            this.button_cancelling.UseVisualStyleBackColor = true;
            this.button_cancelling.Click += new System.EventHandler(this.button_cancelling_Click);
            // 
            // richTextBox_log
            // 
            this.richTextBox_log.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.richTextBox_log.Font = new System.Drawing.Font("맑은 고딕", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.richTextBox_log.Location = new System.Drawing.Point(9, 31);
            this.richTextBox_log.Name = "richTextBox_log";
            this.richTextBox_log.ReadOnly = true;
            this.richTextBox_log.Size = new System.Drawing.Size(484, 307);
            this.richTextBox_log.TabIndex = 8;
            this.richTextBox_log.Text = "";
            // 
            // groupBox_log
            // 
            this.groupBox_log.Controls.Add(this.richTextBox_log);
            this.groupBox_log.Font = new System.Drawing.Font("맑은 고딕", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.groupBox_log.Location = new System.Drawing.Point(12, 214);
            this.groupBox_log.Name = "groupBox_log";
            this.groupBox_log.Size = new System.Drawing.Size(501, 344);
            this.groupBox_log.TabIndex = 11;
            this.groupBox_log.TabStop = false;
            this.groupBox_log.Text = "Client log";
            // 
            // AudioNoiseCancellingApplication
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(529, 571);
            this.Controls.Add(this.group_cancelling);
            this.Controls.Add(this.groupBox_log);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "AudioNoiseCancellingApplication";
            this.Text = "AudioNoiseCancelling";
            this.group_cancelling.ResumeLayout(false);
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.groupBox_log.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private GroupBox group_cancelling;
        private GroupBox groupBox1;
        private RadioButton radioButton_encryptFFT;
        private RadioButton radioButton_encryptDFT;
        private Button button_cancelling;
        private RichTextBox richTextBox_log;
        private GroupBox groupBox_log;
    }
}