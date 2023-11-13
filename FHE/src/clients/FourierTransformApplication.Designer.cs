namespace FHE.src.clients
{
    partial class FourierTransformApplication
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
            this.group_multiplication = new System.Windows.Forms.GroupBox();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.radioButton_encryptFFT = new System.Windows.Forms.RadioButton();
            this.radioButton_encryptDFT = new System.Windows.Forms.RadioButton();
            this.button_copy = new System.Windows.Forms.Button();
            this.textBox_result = new System.Windows.Forms.TextBox();
            this.label_result = new System.Windows.Forms.Label();
            this.button_multiply = new System.Windows.Forms.Button();
            this.textBox_Integer2 = new System.Windows.Forms.TextBox();
            this.label_Integer2 = new System.Windows.Forms.Label();
            this.label_Integer1 = new System.Windows.Forms.Label();
            this.textBox_Integer1 = new System.Windows.Forms.TextBox();
            this.richTextBox_log = new System.Windows.Forms.RichTextBox();
            this.groupBox_log = new System.Windows.Forms.GroupBox();
            this.group_multiplication.SuspendLayout();
            this.groupBox1.SuspendLayout();
            this.groupBox_log.SuspendLayout();
            this.SuspendLayout();
            // 
            // group_multiplication
            // 
            this.group_multiplication.Controls.Add(this.groupBox1);
            this.group_multiplication.Controls.Add(this.button_copy);
            this.group_multiplication.Controls.Add(this.textBox_result);
            this.group_multiplication.Controls.Add(this.label_result);
            this.group_multiplication.Controls.Add(this.button_multiply);
            this.group_multiplication.Controls.Add(this.textBox_Integer2);
            this.group_multiplication.Controls.Add(this.label_Integer2);
            this.group_multiplication.Controls.Add(this.label_Integer1);
            this.group_multiplication.Controls.Add(this.textBox_Integer1);
            this.group_multiplication.Font = new System.Drawing.Font("맑은 고딕", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.group_multiplication.Location = new System.Drawing.Point(12, 12);
            this.group_multiplication.Name = "group_multiplication";
            this.group_multiplication.Size = new System.Drawing.Size(501, 261);
            this.group_multiplication.TabIndex = 0;
            this.group_multiplication.TabStop = false;
            this.group_multiplication.Text = "Multiplication of large numbers";
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
            // button_copy
            // 
            this.button_copy.Cursor = System.Windows.Forms.Cursors.Hand;
            this.button_copy.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.button_copy.Location = new System.Drawing.Point(376, 208);
            this.button_copy.Name = "button_copy";
            this.button_copy.Size = new System.Drawing.Size(97, 29);
            this.button_copy.TabIndex = 7;
            this.button_copy.Text = "Copy";
            this.button_copy.UseVisualStyleBackColor = true;
            this.button_copy.Click += new System.EventHandler(this.button_copy_Click);
            // 
            // textBox_result
            // 
            this.textBox_result.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.textBox_result.Cursor = System.Windows.Forms.Cursors.IBeam;
            this.textBox_result.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.textBox_result.Location = new System.Drawing.Point(99, 209);
            this.textBox_result.Name = "textBox_result";
            this.textBox_result.ReadOnly = true;
            this.textBox_result.Size = new System.Drawing.Size(263, 27);
            this.textBox_result.TabIndex = 6;
            // 
            // label_result
            // 
            this.label_result.AutoSize = true;
            this.label_result.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.label_result.Location = new System.Drawing.Point(29, 211);
            this.label_result.Name = "label_result";
            this.label_result.Size = new System.Drawing.Size(50, 20);
            this.label_result.TabIndex = 5;
            this.label_result.Text = "Result";
            // 
            // button_multiply
            // 
            this.button_multiply.Cursor = System.Windows.Forms.Cursors.Hand;
            this.button_multiply.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.button_multiply.Location = new System.Drawing.Point(376, 126);
            this.button_multiply.Name = "button_multiply";
            this.button_multiply.Size = new System.Drawing.Size(97, 70);
            this.button_multiply.TabIndex = 4;
            this.button_multiply.Text = "Multiply";
            this.button_multiply.UseVisualStyleBackColor = true;
            this.button_multiply.Click += new System.EventHandler(this.button_multiply_Click);
            // 
            // textBox_Integer2
            // 
            this.textBox_Integer2.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.textBox_Integer2.Cursor = System.Windows.Forms.Cursors.IBeam;
            this.textBox_Integer2.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.textBox_Integer2.Location = new System.Drawing.Point(99, 167);
            this.textBox_Integer2.Name = "textBox_Integer2";
            this.textBox_Integer2.Size = new System.Drawing.Size(263, 27);
            this.textBox_Integer2.TabIndex = 3;
            // 
            // label_Integer2
            // 
            this.label_Integer2.AutoSize = true;
            this.label_Integer2.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.label_Integer2.Location = new System.Drawing.Point(22, 169);
            this.label_Integer2.Name = "label_Integer2";
            this.label_Integer2.Size = new System.Drawing.Size(65, 20);
            this.label_Integer2.TabIndex = 2;
            this.label_Integer2.Text = "Integer2";
            // 
            // label_Integer1
            // 
            this.label_Integer1.AutoSize = true;
            this.label_Integer1.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.label_Integer1.Location = new System.Drawing.Point(22, 128);
            this.label_Integer1.Name = "label_Integer1";
            this.label_Integer1.Size = new System.Drawing.Size(65, 20);
            this.label_Integer1.TabIndex = 1;
            this.label_Integer1.Text = "Integer1";
            // 
            // textBox_Integer1
            // 
            this.textBox_Integer1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.textBox_Integer1.Cursor = System.Windows.Forms.Cursors.IBeam;
            this.textBox_Integer1.Font = new System.Drawing.Font("맑은 고딕", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.textBox_Integer1.Location = new System.Drawing.Point(99, 126);
            this.textBox_Integer1.Name = "textBox_Integer1";
            this.textBox_Integer1.Size = new System.Drawing.Size(263, 27);
            this.textBox_Integer1.TabIndex = 0;
            // 
            // richTextBox_log
            // 
            this.richTextBox_log.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.richTextBox_log.Font = new System.Drawing.Font("맑은 고딕", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.richTextBox_log.Location = new System.Drawing.Point(9, 31);
            this.richTextBox_log.Name = "richTextBox_log";
            this.richTextBox_log.Size = new System.Drawing.Size(484, 225);
            this.richTextBox_log.TabIndex = 8;
            this.richTextBox_log.Text = "";
            // 
            // groupBox_log
            // 
            this.groupBox_log.Controls.Add(this.richTextBox_log);
            this.groupBox_log.Font = new System.Drawing.Font("맑은 고딕", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.groupBox_log.Location = new System.Drawing.Point(12, 292);
            this.groupBox_log.Name = "groupBox_log";
            this.groupBox_log.Size = new System.Drawing.Size(501, 266);
            this.groupBox_log.TabIndex = 9;
            this.groupBox_log.TabStop = false;
            this.groupBox_log.Text = "Process log";
            // 
            // FourierTransformApplication
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(532, 570);
            this.Controls.Add(this.groupBox_log);
            this.Controls.Add(this.group_multiplication);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "FourierTransformApplication";
            this.Text = "FourierTransformApplication";
            this.group_multiplication.ResumeLayout(false);
            this.group_multiplication.PerformLayout();
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.groupBox_log.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private GroupBox group_multiplication;
        private TextBox textBox_result;
        private Label label_result;
        private Button button_multiply;
        private TextBox textBox_Integer2;
        private Label label_Integer2;
        private Label label_Integer1;
        private TextBox textBox_Integer1;
        private Button button_copy;
        private RichTextBox richTextBox_log;
        private GroupBox groupBox_log;
        private GroupBox groupBox1;
        private RadioButton radioButton_encryptFFT;
        private RadioButton radioButton_encryptDFT;
    }
}